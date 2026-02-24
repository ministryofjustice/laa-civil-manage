import { stubObject } from "ts-sinon";
import { strict as assert } from "node:assert";
import type { Request, Response } from "express";
import { getSessionUrl } from "#src/middleware/session/session-handler.js";

describe("getSessionUrl", () => {
  const response = { redirect: () => undefined } as unknown as Response;
  const nextHolder = { next: () => null };
  it("should change originalUrl on request session object to current path if it is not an auth endpoint", () => {
    const requestStub = stubObject({
      path: "/applications/L-000-001",
      originalUrl: "/applications/L-000-001",
      session: {},
    }) as Request;

    const resStub = stubObject(response, { redirect: undefined });
    const nextStub = stubObject(nextHolder, { next: null });

    getSessionUrl(requestStub, resStub, nextStub.next);

    assert.equal(requestStub.session.originalUrl, "/applications/L-000-001");
    assert.equal(nextStub.next.callCount, 1);
  });
  it("when request is made to auth/login endpoint originalUrl on the session object should be undefined", () => {
    const requestStub = stubObject({
      path: "/auth/login",
      originalUrl: "/auth/login",
      session: {},
    }) as Request;
    const resStub = stubObject(response, { redirect: undefined });
    const nextStub = stubObject(nextHolder, { next: null });

    getSessionUrl(requestStub, resStub, nextStub.next);

    assert.equal(requestStub.session.originalUrl, undefined);
    assert.equal(nextStub.next.callCount, 1);
  });
  it("when request is made to auth/redirect endpoint originalUrl on the session object should be undefined", () => {
    const requestStub = stubObject({
      path: "/auth/redirect",
      originalUrl: "/auth/redirect",
      session: {},
    }) as Request;
    const resStub = stubObject(response, { redirect: undefined });
    const nextStub = stubObject(nextHolder, { next: null });

    getSessionUrl(requestStub, resStub, nextStub.next);

    assert.equal(requestStub.session.originalUrl, undefined);
    assert.equal(nextStub.next.callCount, 1);
  });
  it("when request is made to auth/logout endpoint originalUrl on the session object should be undefined", () => {
    const requestStub = stubObject({
      path: "/auth/logout",
      originalUrl: "/auth/logout",
      session: {},
    }) as Request;
    const resStub = stubObject(response, { redirect: undefined });
    const nextStub = stubObject(nextHolder, { next: null });

    getSessionUrl(requestStub, resStub, nextStub.next);

    assert.equal(requestStub.session.originalUrl, undefined);
    assert.equal(nextStub.next.callCount, 1);
  });
});
