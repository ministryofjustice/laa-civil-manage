import type { Request, Response } from "express";
import { getSessionUrl } from "#src/middleware/session/session-handler.js";
import { describe, expect, it, mock } from "bun:test";

describe("getSessionUrl", () => {
  const response = { redirect: () => undefined } as unknown as Response;
  it("should change originalUrl on request session object to current path if it is not an auth endpoint", () => {
    const requestStub = {
      path: "/applications/L-000-001",
      originalUrl: "/applications/L-000-001",
      session: {},
    } as Request;

    const resStub = { ...response } as Response;
    const nextStub = mock();

    getSessionUrl(requestStub, resStub, nextStub);

    expect(requestStub.session.originalUrl).toBe("/applications/L-000-001");
    expect(nextStub).toHaveBeenCalled();
  });
  it("when request is made to auth/login endpoint originalUrl on the session object should be undefined", () => {
    const requestStub = {
      path: "/auth/login",
      originalUrl: "/auth/login",
      session: {},
    } as Request;
    const resStub = { ...response } as Response;
    const nextStub = mock();

    getSessionUrl(requestStub, resStub, nextStub);

    expect(requestStub.session.originalUrl).toEqual(undefined);
    expect(nextStub).toHaveBeenCalled();
  });
  it("when request is made to auth/redirect endpoint originalUrl on the session object should be undefined", () => {
    const requestStub = {
      path: "/auth/redirect",
      originalUrl: "/auth/redirect",
      session: {},
    } as Request;
    const resStub = { ...response } as Response;
    const nextStub = mock();

    getSessionUrl(requestStub, resStub, nextStub);

    expect(requestStub.session.originalUrl).toEqual(undefined);
    expect(nextStub).toHaveBeenCalled();
  });
  it("when request is made to auth/logout endpoint originalUrl on the session object should be undefined", () => {
    const requestStub = {
      path: "/auth/logout",
      originalUrl: "/auth/logout",
      session: {},
    } as Request;
    const resStub = { ...response } as Response;
    const nextStub = mock();

    getSessionUrl(requestStub, resStub, nextStub);

    expect(requestStub.session.originalUrl).toEqual(undefined);
    expect(nextStub).toHaveBeenCalled();
  });
});
