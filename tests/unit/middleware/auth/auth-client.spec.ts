import {
  checkIfValidSession,
  login,
  logout,
  redirect,
} from "#src/middleware/auth/auth-handlers.js";
import { stubObject, stubInterface } from "ts-sinon";
import sinon from "sinon";
import { strict as assert } from "node:assert";
import type { Request, Response } from "express";
import type session from "#src/types/express-session/index.js"; // Ensure the module is imported to apply the type augmentation

import msalClient from "#src/middleware/auth/auth-client.js";
import { config } from "#config.js";

describe("checkAuthToken", () => {
  const response = { redirect: () => undefined } as unknown as Response;
  const nextHolder = { next: () => null };
  const verifyTokenStub: () => Promise<boolean> = async () =>
    await new Promise<boolean>((resolve) => {
      resolve(true);
    });
  it("should redirect unauthenticated users to the auth/login page if they try to hit a authenticated endpoint", async () => {
    const requestStub = stubObject({ path: "", session: {} }) as Request;
    const resStub = stubObject(response, { redirect: undefined });
    const nextStub = stubObject(nextHolder, { next: null });

    await checkIfValidSession(
      requestStub,
      resStub,
      nextStub.next,
      verifyTokenStub,
    );

    assert.equal(resStub.redirect.callCount, 1);
    assert.equal(resStub.redirect.firstCall.args[0], "/auth/login");
    assert.equal(nextStub.next.callCount, 0);
  });

  it("should allow authenticated users the requested endpoint", async () => {
    const requestStub = stubObject({
      path: "",
      session: { idToken: "some-token" },
    }) as Request;
    const nextStub = stubObject(nextHolder, { next: null });
    const resStub = stubObject(response, { redirect: undefined });

    await checkIfValidSession(
      requestStub,
      resStub,
      nextStub.next,
      verifyTokenStub,
    );
    assert.equal(resStub.redirect.callCount, 0);
    assert.equal(nextStub.next.callCount, 1);
  });

  it("should not authenticate on mock-data endpoints", async () => {
    const requestStub = stubObject({
      path: "/mock-data",
      session: {},
    }) as Request;
    const resStub = stubObject(response, { redirect: undefined });
    const nextStub = stubObject(nextHolder, { next: null });
    await checkIfValidSession(
      requestStub,
      resStub,
      nextStub.next,
      verifyTokenStub,
    );
    assert.equal(resStub.redirect.callCount, 0);
    assert.equal(nextStub.next.callCount, 1);
  });
  it("should redirect upon invalid token", async () => {
    const requestStub = stubObject({
      path: "",
      session: { idToken: "some-token" },
    }) as Request;
    const failingVerifyStub: () => Promise<boolean> = async () =>
      await new Promise<boolean>((resolve) => {
        resolve(false);
      });
    const resStub = stubObject(response, { redirect: undefined });
    const nextStub = stubObject(nextHolder, { next: null });

    await checkIfValidSession(
      requestStub,
      resStub,
      nextStub.next,
      failingVerifyStub,
    );

    assert.equal(resStub.redirect.callCount, 1);
    assert.equal(resStub.redirect.firstCall.args[0], "/auth/login");
    assert.equal(nextStub.next.callCount, 0);
  });
});

describe("login", () => {
  const res = { redirect: (location: string) => null } as unknown as Response;
  const nextHolder = { next: () => null };

  afterEach(() => {
    sinon.restore();
  });

  it("should redirect to auth code url if the auth code is retrieved successfully", async () => {
    const getAuthCodeUrlStub = sinon.stub(msalClient, "getAuthCodeUrl");
    getAuthCodeUrlStub.resolves("http://testing_redirect");

    const req = stubInterface<Request>();
    const nextStub = stubObject(nextHolder, { next: null });
    const resStub = stubObject(res, { redirect: undefined });

    await login(req, resStub, nextStub.next);
    assert.equal(getAuthCodeUrlStub.callCount, 1);
    assert.deepEqual(getAuthCodeUrlStub.firstCall.args[0].scopes, [
      "user.read",
      "offline_access",
    ]);
    assert.equal(
      getAuthCodeUrlStub.firstCall.args[0].redirectUri,
      config.auth.redirectUri,
    );
    assert.equal(
      getAuthCodeUrlStub.firstCall.args[0].authority,
      config.auth.authDirectory,
    );
    assert.equal(resStub.redirect.callCount, 1);
    assert.equal(resStub.redirect.firstCall.args[0], "http://testing_redirect");
    assert.equal(nextStub.next.callCount, 0);
  });

  it("next should be called instead of redirect if getAuthCodeUrl fails", async () => {
    const getAuthCodeUrlStub = sinon.stub(msalClient, "getAuthCodeUrl");
    getAuthCodeUrlStub.rejects(new Error("Error getting auth code url"));

    const req = stubInterface<Request>();
    const nextStub = stubObject(nextHolder, { next: null });
    const resStub = stubObject(res, { redirect: undefined });

    await login(req, resStub, nextStub.next);
    assert.equal(getAuthCodeUrlStub.callCount, 1);
    assert.equal(resStub.redirect.callCount, 0);
    assert.equal(nextStub.next.callCount, 1);
  });
});

describe("redirect", () => {
  const res = { redirect: () => null } as unknown as Response;
  const nextHolder = { next: () => null };

  afterEach(() => {
    sinon.restore();
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
    const acquireTokenByCodeStub = sinon.stub(msalClient, "acquireTokenByCode");
    acquireTokenByCodeStub.resolves(tokenResponse);

    const req = stubInterface<Request>();
    req.query.code = "auth-code";
    const resStub = stubObject(res, { redirect: undefined });
    const nextStub = stubObject(nextHolder, { next: null });

    await redirect(req, resStub, nextStub.next);

    assert.equal(req.session.idToken, "token");

    assert.equal(acquireTokenByCodeStub.callCount, 1);
    assert.deepEqual(acquireTokenByCodeStub.firstCall.args[0], {
      code: "auth-code",
      scopes: ["user.read", "offline_access"],
      redirectUri: config.auth.redirectUri,
      accessType: "offline",
      tokenBodyParameters: {
        client_secret: config.auth.clientSecret,
      },
    });
    assert.equal(resStub.redirect.callCount, 1);
    assert.equal(resStub.redirect.firstCall.args[0], "/applications");
    assert.equal(nextStub.next.callCount, 0);
  });

  it("redirects to /applications by default", async () => {
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
    const acquireTokenByCodeStub = sinon.stub(msalClient, "acquireTokenByCode");
    acquireTokenByCodeStub.resolves(tokenResponse);

    const requestStub = stubInterface<Request>();
    requestStub.query = { code: "string" };
    requestStub.session = stubInterface<session.Session>();
    requestStub.session.originalUrl = undefined;

    const nextStub = stubObject(nextHolder, { next: null });
    const resStub = stubObject(res, { redirect: undefined });

    await redirect(requestStub, resStub, nextStub.next);

    assert.equal(resStub.redirect.callCount, 1);
    assert.equal(resStub.redirect.firstCall.args[0], "/applications");
  });

  it("redirects to requested url when there is originalUrl saved in session", async () => {
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
    const acquireTokenByCodeStub = sinon.stub(msalClient, "acquireTokenByCode");
    acquireTokenByCodeStub.resolves(tokenResponse);

    const requestStub = stubInterface<Request>();
    requestStub.originalUrl = "/applications/L-000-001";

    requestStub.query = { code: "string" };
    requestStub.session = stubInterface<session.Session>();
    requestStub.session.originalUrl = "/applications/L-000-001";

    const nextStub = stubObject(nextHolder, { next: null });
    const resStub = stubObject(res, { redirect: undefined });

    await redirect(requestStub, resStub, nextStub.next);

    assert.equal(resStub.redirect.callCount, 1);
    assert.equal(resStub.redirect.firstCall.args[0], "/applications/L-000-001");
  });

  it("next should be called if acquireTokenByCode fails", async () => {
    const acquireTokenByCodeStub = sinon.stub(msalClient, "acquireTokenByCode");
    acquireTokenByCodeStub.rejects(new Error("Redirect failed"));

    const req = stubInterface<Request>();
    req.query = { code: "auth-code" };
    const nextStub = stubObject(nextHolder, { next: null });
    const resStub = stubObject(res, { redirect: undefined });

    await redirect(req, resStub, nextStub.next);

    assert.equal(acquireTokenByCodeStub.callCount, 1);
    assert.equal(resStub.redirect.callCount, 0);
    assert.equal(nextStub.next.callCount, 1);
  });
});

describe("logout", () => {
  const res = { redirect: (location: string) => null } as unknown as Response;
  const nextHolder = { next: () => null };

  afterEach(() => {
    sinon.restore();
  });

  it("should destroy the session and redirect to home page", () => {
    const req = stubInterface<Request>();
    req.session.destroy = (callback: (err: unknown) => void) => {
      callback(null);
      return req.session as session.Session;
    };
    const nextStub = stubObject(nextHolder, { next: null });
    const resStub = stubObject(res, { redirect: undefined });

    logout(req, resStub, nextStub.next);

    assert.equal(resStub.redirect.callCount, 1);
    assert.equal(resStub.redirect.firstCall.args[0], "/");
    assert.equal(nextStub.next.callCount, 0);
  });

  it("next should be called if session destroy fails", () => {
    const sessionDestroyError = new Error("Session destroy failed");
    const req = stubInterface<Request>();

    req.session.destroy = (callback: (err: unknown) => void) => {
      callback(sessionDestroyError);
      return req.session as session.Session;
    };

    const nextStub = stubObject(nextHolder, { next: null });
    const resStub = stubObject(res, { redirect: undefined });

    logout(req, resStub, nextStub.next);

    assert.equal(resStub.redirect.callCount, 0);
    assert.equal(nextStub.next.callCount, 1);
    assert.deepStrictEqual(nextStub.next.firstCall.args, [sessionDestroyError]);
  });
});
