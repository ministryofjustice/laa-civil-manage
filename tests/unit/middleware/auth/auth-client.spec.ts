import {
  checkIfValidSession,
  login,
  logout,
  redirect,
} from "#src/middleware/auth/auth-handlers.js";
import type { Request, Response } from "express";
import type session from "#src/types/express-session/index.js";
import msalClient from "#src/middleware/auth/auth-client.js";
import { config } from "#src/config.js";
import { describe, it, afterEach, expect, mock } from "bun:test";

describe("checkAuthToken", () => {
  afterEach(() => {
    mock.restore();
  });

  const response = { redirect: undefined } as unknown as Response;
  const nextHolder = { next: () => null };
  const verifyTokenStub: () => Promise<boolean> = async () =>
    await new Promise<boolean>((resolve) => {
      resolve(true);
    });

  it("should redirect unauthenticated users to the auth/login page if they try to hit a authenticated endpoint", async () => {
    const redirectMock = mock();
    const requestStub = { path: "", session: {} } as Request;
    const resStub = {
      ...response,
      redirect: redirectMock,
    } as unknown as Response;
    const nextStub = { ...nextHolder, next: mock() } as unknown as {
      next: () => void;
    };

    await checkIfValidSession(
      requestStub,
      resStub,
      nextStub.next,
      verifyTokenStub,
    );

    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/auth/login");
    expect(nextStub.next).toHaveBeenCalledTimes(0);
  });

  it("should allow authenticated users the requested endpoint", async () => {
    const requestStub = {
      path: "",
      session: { idToken: "some-token" },
    } as Request;
    const nextStub = { ...nextHolder, next: mock() } as unknown as {
      next: () => void;
    };
    const redirectMock = mock();
    const resStub = {
      ...response,
      redirect: redirectMock,
    } as unknown as Response;

    await checkIfValidSession(
      requestStub,
      resStub,
      nextStub.next,
      verifyTokenStub,
    );

    expect(redirectMock).toHaveBeenCalledTimes(0);
    expect(nextStub.next).toHaveBeenCalledTimes(1);
  });

  it("should redirect upon invalid token", async () => {
    const redirectMock = mock();

    const requestStub = {
      path: "",
      session: { idToken: "invalid-token" },
    } as Request;
    const failingVerifyStub: () => Promise<boolean> = async () =>
      await new Promise<boolean>((resolve) => {
        resolve(false);
      });
    const resStub = {
      ...response,
      redirect: redirectMock,
    } as unknown as Response;
    const nextStub = { ...nextHolder, next: mock() } as unknown as {
      next: () => void;
    };

    await checkIfValidSession(
      requestStub,
      resStub,
      nextStub.next,
      failingVerifyStub,
    );

    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/auth/login");
    expect(nextStub.next).toHaveBeenCalledTimes(0);
  });
});

describe("login", () => {
  const res = { redirect: (location: string) => null } as unknown as Response;
  const nextHolder = { next: () => null };

  afterEach(() => {
    mock.restore();
  });

  it("should redirect to auth code url if the auth code is retrieved successfully", async () => {
    const getAuthCodeUrlStub = mock().mockReturnValue(
      "http://testing_redirect",
    );
    msalClient.getAuthCodeUrl = getAuthCodeUrlStub as never;

    const redirectMock = mock();
    const req = {} as Request;
    const nextStub = { ...nextHolder, next: mock() } as unknown as {
      next: () => void;
    };
    const resStub = { ...res, redirect: redirectMock } as unknown as Response;

    await login(req, resStub, nextStub.next);
    const firstCallArgs = getAuthCodeUrlStub.mock.calls[0][0] as {
      scopes: string[];
      redirectUri: string;
      authority: string | undefined;
    };

    expect(getAuthCodeUrlStub).toHaveBeenCalledTimes(1);
    expect(firstCallArgs.scopes).toEqual(["user.read", "offline_access"]);
    expect(firstCallArgs.redirectUri).toEqual(config.auth.redirectUri);
    expect(firstCallArgs.authority).toEqual(config.auth.authDirectory);
    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("http://testing_redirect");
    expect(nextStub.next).toHaveBeenCalledTimes(0);
  });

  it("next should be called instead of redirect if getAuthCodeUrl fails", async () => {
    const getAuthCodeUrlStub = mock().mockRejectedValue(
      new Error("Error getting auth code url"),
    );
    const redirectMock = mock();
    msalClient.getAuthCodeUrl = getAuthCodeUrlStub as never;

    const req = { session: {} } as Request;
    const nextStub = { ...nextHolder, next: mock() } as unknown as {
      next: () => void;
    };
    const resStub = { ...res, redirect: redirectMock } as unknown as Response;

    await login(req, resStub, nextStub.next);

    expect(getAuthCodeUrlStub).toHaveBeenCalled();
    expect(redirectMock).toBeCalledTimes(0);
    expect(nextStub.next).toHaveBeenCalled();
  });
});

describe("redirect", () => {
  const res = { redirect: () => null } as unknown as Response;
  const nextHolder = { next: () => null };

  afterEach(() => {
    mock.restore();
  });

  it("should set the session id token to the value from the token response", async () => {
    const tokenResponse = {
      authority: "authority",
      uniqueId: "uniqueId",
      tenantId: "tenantId",
      scopes: ["user.read", "offline_access"],
      account: null,
      idToken: "token",
      idTokenClaims: {},
      accessToken: "accessToken",
      fromCache: false,
      expiresOn: null,
      tokenType: "Bearer",
      correlationId: "correlationId",
    };

    const acquireTokenByCodeStub = mock().mockReturnValue(tokenResponse);
    msalClient.acquireTokenByCode = acquireTokenByCodeStub as never;
    const redirectMock = mock();
    const req = { query: {}, session: {} } as Request;
    req.query.code = "auth-code";
    const resStub = { ...res, redirect: redirectMock } as unknown as Response;
    const nextStub = { ...nextHolder, next: mock() } as unknown as {
      next: () => void;
    };

    await redirect(req, resStub, nextStub.next);

    expect(req.session.idToken).toBe("token");
    expect(acquireTokenByCodeStub).toHaveBeenCalled();
    expect(acquireTokenByCodeStub.mock.calls[0][0]).toEqual({
      code: "auth-code",
      scopes: ["user.read", "offline_access"],
      redirectUri: config.auth.redirectUri,
      accessType: "offline",
    });

    expect(redirectMock).toHaveBeenCalled();
    expect(redirectMock.mock.calls[0][0]).toEqual("/");
    expect(nextStub.next).not.toHaveBeenCalled();
  });

  it("redirects to / by default", async () => {
    const tokenResponse = {
      authority: "authority",
      uniqueId: "uniqueId",
      tenantId: "tenantId",
      scopes: ["user.read", "offline_access"],
      account: null,
      idToken: "token",
      idTokenClaims: {},
      accessToken: "accessToken",
      fromCache: false,
      expiresOn: null,
      tokenType: "Bearer",
      correlationId: "correlationId",
    };

    const acquireTokenByCodeStub = mock().mockReturnValue(tokenResponse);
    msalClient.acquireTokenByCode = acquireTokenByCodeStub as never;
    const redirectMock = mock();
    const requestStub = { query: {}, session: {} } as Request;
    requestStub.query = { code: "string" };
    requestStub.session.originalUrl = undefined;

    const nextStub = { ...nextHolder, next: mock() } as unknown as {
      next: () => void;
    };
    const resStub = { ...res, redirect: redirectMock } as unknown as Response;

    await redirect(requestStub, resStub, nextStub.next);

    expect(redirectMock).toHaveBeenCalled();
    expect(redirectMock.mock.calls[0][0]).toBe("/");
  });

  it("redirects to requested url when there is originalUrl saved in session which matches an allowed path", async () => {
    const tokenResponse = {
      authority: "authority",
      uniqueId: "uniqueId",
      tenantId: "tenantId",
      scopes: ["user.read", "offline_access"],
      account: null,
      idToken: "token",
      idTokenClaims: {},
      accessToken: "accessToken",
      fromCache: false,
      expiresOn: null,
      tokenType: "Bearer",
      correlationId: "correlationId",
    };

    const acquireTokenByCodeStub = mock().mockReturnValue(tokenResponse);
    msalClient.acquireTokenByCode = acquireTokenByCodeStub as never;

    const redirectMock = mock();

    const requestStub = {} as Request;
    requestStub.originalUrl = "/test-url";

    requestStub.query = { code: "string" };
    requestStub.session = {} as session.Session;
    requestStub.session.originalUrl = "/test-url";

    const nextStub = { next: () => null };

    const resStub = { ...res, redirect: redirectMock } as unknown as Response;

    await redirect(requestStub, resStub, nextStub.next);

    expect(redirectMock).toHaveBeenCalled();
    expect(redirectMock.mock.calls[0][0]).toBe("/test-url");
  });

  it("next should be called if acquireTokenByCode fails", async () => {
    const acquireTokenByCodeStub = mock().mockRejectedValue(
      new Error("Redirect failed"),
    );
    msalClient.acquireTokenByCode = acquireTokenByCodeStub as never;
    const redirectMock = mock();
    const req = { session: {} } as Request;
    req.query = { code: "auth-code" };
    const nextStub = mock();
    const resStub = { redirect: redirectMock } as unknown as Response;

    await redirect(req, resStub, nextStub);

    expect(acquireTokenByCodeStub).toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
    expect(nextStub).toHaveBeenCalled();
  });
});

describe("logout", () => {
  const res = { redirect: (location: string) => null } as unknown as Response;
  const nextHolder = { next: () => null };

  afterEach(() => {
    mock.restore();
  });

  it("should destroy the session and redirect to home page", () => {
    const redirectMock = mock();
    const req = { session: {} } as Request;
    req.session.destroy = (callback: (err: unknown) => void) => {
      callback(null);
      return req.session;
    };
    const nextStub = { ...nextHolder, next: mock() } as unknown as {
      next: () => void;
    };
    const resStub = { ...res, redirect: redirectMock } as unknown as Response;

    logout(req, resStub, nextStub.next);

    expect(redirectMock).toHaveBeenCalled();
    expect(redirectMock.mock.calls[0][0]).toBe("/");
    expect(nextStub.next).not.toHaveBeenCalled();
  });

  it("next should be called if session destroy fails", () => {
    const sessionDestroyError = new Error("Session destroy failed");
    const redirectMock = mock();
    const req = { session: {} } as Request;

    req.session.destroy = (callback: (err: unknown) => void) => {
      callback(sessionDestroyError);
      return req.session;
    };

    const nextStub = { ...nextHolder, next: mock() };
    const resStub = { ...res, redirect: redirectMock } as unknown as Response;

    logout(req, resStub, nextStub.next);

    expect(redirectMock).not.toHaveBeenCalled();
    expect(nextStub.next).toHaveBeenCalled();
    expect(nextStub.next.mock.calls[0][0]).toEqual(sessionDestroyError);
  });
});
