import {
  describe,
  it,
  expect,
  mock,
  spyOn,
  beforeEach,
  afterEach,
} from "bun:test";
import type { Request, Response } from "express";
import type { InternalAxiosRequestConfig } from "#node_modules/axios/index.js";
import type {
  TokenCache,
  AuthenticationResult,
  AccountInfo,
} from "@azure/msal-node";
import { api, authContextMiddleware } from "#src/middleware/auth/apiClient.js";
import { requestContext } from "#src/utils/requestContext.js";
import { CORRELATION_ID_HEADER } from "#src/middleware/correlationId.js";
import { logger } from "#src/utils/logger.js";
import msalClient from "#src/middleware/auth/authClient.js";

describe("authContextMiddleware", () => {
  const msalClientPartial = msalClient as Partial<typeof msalClient>;
  const originalGetTokenCache =
    msalClientPartial.getTokenCache?.bind(msalClient);
  const originalAcquireTokenSilent =
    msalClientPartial.acquireTokenSilent?.bind(msalClient);

  afterEach(() => {
    if (originalGetTokenCache === undefined) {
      delete msalClientPartial.getTokenCache;
    } else {
      msalClientPartial.getTokenCache = originalGetTokenCache;
    }
    if (originalAcquireTokenSilent === undefined) {
      delete msalClientPartial.acquireTokenSilent;
    } else {
      msalClientPartial.acquireTokenSilent = originalAcquireTokenSilent;
    }
    mock.restore();
  });

  it("calls next when the session has an access token (fallback)", async () => {
    const next = mock();
    const req = { session: { accessToken: "tok-123" } } as unknown as Request;
    const res = { redirect: mock() } as unknown as Response;

    await authContextMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("calls next when there is no access token", async () => {
    const next = mock();
    const req = { session: {} } as unknown as Request;
    const res = { redirect: mock() } as unknown as Response;

    await authContextMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("silently refreshes the token when homeAccountId is present", async () => {
    const next = mock();
    const destroyMock = mock((cb?: () => void) => cb?.());
    const req = {
      session: {
        homeAccountId: "home-123",
        accessToken: "old-tok",
        destroy: destroyMock,
      },
    } as unknown as Request;
    const res = { redirect: mock() } as unknown as Response;

    const mockAccount = { homeAccountId: "home-123" } as AccountInfo;

    msalClient.getTokenCache = mock(
      () =>
        ({
          getAccountByHomeId: mock(
            async () => await Promise.resolve(mockAccount),
          ),
        }) as unknown as TokenCache,
    );

    msalClient.acquireTokenSilent = mock(
      async () =>
        await Promise.resolve({
          accessToken: "fresh-access",
          idToken: "fresh-id",
        } as unknown as AuthenticationResult),
    );

    await authContextMiddleware(req, res, next);

    expect(req.session.accessToken).toBe("fresh-access");
    expect(req.session.idToken).toBe("fresh-id");
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("destroys session and redirects to login if silent refresh fails", async () => {
    const next = mock();

    const destroyMock = mock((cb?: () => void) => {
      cb?.();
    });

    const req = {
      session: { homeAccountId: "home-123", destroy: destroyMock },
    } as unknown as Request;

    const redirectMock = mock();
    const res = {
      redirect: redirectMock,
    } as unknown as Response;

    const mockAccount = { homeAccountId: "home-123" } as AccountInfo;

    msalClient.getTokenCache = mock(
      () =>
        ({
          getAccountByHomeId: mock(
            async () => await Promise.resolve(mockAccount),
          ),
        }) as unknown as TokenCache,
    );

    msalClient.acquireTokenSilent = mock(
      async () => await Promise.reject(new Error("Refresh token expired")),
    );

    await authContextMiddleware(req, res, next);

    expect(destroyMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/auth/login");
    expect(next).not.toHaveBeenCalled();
  });
});

describe("api client", () => {
  const originalAdapter = api.defaults.adapter;
  const originalSkipAuth = process.env.SKIP_AUTH;

  beforeEach(() => {
    process.env.SKIP_AUTH = "false";
  });

  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    process.env.SKIP_AUTH = originalSkipAuth;
    mock.restore();
  });

  const runInContext = async <T>(
    session: Partial<Request["session"]>,
    fn: () => Promise<T>,
  ): Promise<T> =>
    await new Promise<T>((resolve, reject) => {
      authContextMiddleware(
        { session } as unknown as Request,
        { redirect: mock() } as unknown as Response,
        () => {
          void fn().catch(reject).then(resolve);
        },
      ).catch(reject);
    });

  it("attaches the session's bearer token to outgoing requests", async () => {
    let seenAuth: unknown;
    api.defaults.adapter = mock(
      async (requestConfig: InternalAxiosRequestConfig) => {
        seenAuth = requestConfig.headers.get("Authorization");
        return await Promise.resolve({
          data: [],
          status: 200,
          statusText: "OK",
          headers: requestConfig.headers,
          config: requestConfig,
        });
      },
    ) as never;

    await runInContext(
      { accessToken: "tok-123" },
      async () => await api.get("/applications"),
    );

    expect(seenAuth).toBe("Bearer tok-123");
  });

  it("throws instead of sending a request when no token is in context", async () => {
    const adapter = mock(
      async (requestConfig: InternalAxiosRequestConfig) =>
        await Promise.resolve({
          data: [],
          status: 200,
          statusText: "OK",
          headers: requestConfig.headers,
          config: requestConfig,
        }),
    );
    api.defaults.adapter = adapter as never;

    const error = await runInContext(
      {},
      async () => await api.get("/applications"),
    ).catch((err: unknown) => err);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(
      "No access token in request context",
    );
    expect(adapter).not.toHaveBeenCalled();
  });

  it("attaches the request's correlation ID to outgoing requests", async () => {
    let seenCorrelationId: unknown;

    api.defaults.adapter = mock(
      async (requestConfig: InternalAxiosRequestConfig) => {
        seenCorrelationId = requestConfig.headers.get(CORRELATION_ID_HEADER);
        return await Promise.resolve({
          data: [],
          status: 200,
          statusText: "OK",
          headers: requestConfig.headers,
          config: requestConfig,
        });
      },
    ) as never;

    await new Promise<void>((resolve, reject) => {
      requestContext.run(
        { correlationId: "corr-abc", getUserId: () => undefined },
        () => {
          authContextMiddleware(
            { session: { accessToken: "tok-123" } } as unknown as Request,
            { redirect: mock() } as unknown as Response,
            () => {
              void api
                .get("/applications")
                .then(() => {
                  resolve();
                })
                .catch(reject);
            },
          ).catch(reject);
        },
      );
    });

    expect(seenCorrelationId).toBe("corr-abc");
  });

  it("logs the backend path without the query string", async () => {
    const logSpy = spyOn(logger, "logInfo");
    api.defaults.adapter = mock(
      async (requestConfig: InternalAxiosRequestConfig) =>
        await Promise.resolve({
          data: [],
          status: 200,
          statusText: "OK",
          headers: requestConfig.headers,
          config: requestConfig,
        }),
    ) as never;

    await runInContext(
      { accessToken: "tok-123" },
      async () => await api.get("/applications?userId=secret-user"),
    );

    const apiLog = logSpy.mock.calls
      .map((call) => call[1])
      .find((message) => message.includes("Backend API:"));

    expect(apiLog).toBeDefined();
    expect(apiLog).toContain("/applications");
    expect(apiLog).not.toContain("secret-user");
    expect(apiLog).not.toContain("?");

    logSpy.mockRestore();
  });
});
