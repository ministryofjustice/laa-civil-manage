import { describe, it, expect, mock, afterEach } from "bun:test";
import type { Request, Response } from "express";
import type { InternalAxiosRequestConfig } from "#node_modules/axios/index.js";
import { api, authContextMiddleware } from "#src/middleware/auth/api-client.js";

describe("authContextMiddleware", () => {
  it("calls next when the session has an access token", () => {
    const next = mock();
    const req = { session: { accessToken: "tok-123" } } as unknown as Request;

    authContextMiddleware(req, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("calls next when there is no access token", () => {
    const next = mock();
    const req = { session: {} } as unknown as Request;

    authContextMiddleware(req, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("api client", () => {
  const originalAdapter = api.defaults.adapter;

  afterEach(() => {
    api.defaults.adapter = originalAdapter;
  });

  const runInContext = async <T>(
    session: Partial<Request["session"]>,
    fn: () => Promise<T>,
  ): Promise<T> =>
    await new Promise<T>((resolve, reject) => {
      authContextMiddleware(
        { session } as unknown as Request,
        {} as Response,
        () => {
          void fn().catch(reject).then(resolve);
        },
      );
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
});
