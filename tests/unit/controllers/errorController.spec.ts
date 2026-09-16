import { describe, expect, it, mock, spyOn, beforeEach } from "bun:test";
import type { NextFunction, Request, Response } from "express";
import { logger } from "#src/utils/logger.js";
import {
  routeNotFound,
  serverErrors,
} from "#src/controllers/errorController.js";

describe("routeNotFound", () => {
  it("renders the 404 page", () => {
    const render = mock();
    const status = mock(() => ({ render }));
    const res = { status } as unknown as Response;

    routeNotFound({} as Request, res);

    expect(status).toHaveBeenCalledWith(404);
    expect(render).toHaveBeenCalledWith("errors/notFound", {
      status: 404,
      message: "Page not found",
    });
  });
});

describe("serverErrors", () => {
  let logInfoSpy: ReturnType<typeof spyOn<typeof logger, "logInfo">>;
  let logErrorSpy: ReturnType<typeof spyOn<typeof logger, "logError">>;

  beforeEach(() => {
    logInfoSpy = spyOn(logger, "logInfo").mockImplementation(() => {});
    logErrorSpy = spyOn(logger, "logError").mockImplementation(() => {});
  });

  it("destroys the session and redirects to /session-timeout when the CSRF token is invalid", () => {
    const destroy = mock((callback: (err: unknown) => void) => {
      callback(null);
    });
    const redirect = mock();
    const render = mock();
    const req = { session: { destroy } } as unknown as Request;
    const res = { redirect, render } as unknown as Response;
    const next = mock() as NextFunction;

    const csrfError = Object.assign(new Error("invalid csrf token"), {
      code: "EBADCSRFTOKEN",
    });

    serverErrors(csrfError, req, res, next);

    expect(destroy).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/session-timeout");
    expect(render).not.toHaveBeenCalled();
    expect(logInfoSpy).toHaveBeenCalled();
  });

  it("logs the failure but still redirects if destroying the session errors", () => {
    const destroy = mock((callback: (err: unknown) => void) => {
      callback(new Error("destroy failed"));
    });
    const redirect = mock();
    const render = mock();
    const req = { session: { destroy } } as unknown as Request;
    const res = { redirect, render } as unknown as Response;
    const next = mock() as NextFunction;

    const csrfError = Object.assign(new Error("invalid csrf token"), {
      code: "EBADCSRFTOKEN",
    });

    serverErrors(csrfError, req, res, next);

    expect(destroy).toHaveBeenCalledTimes(1);
    expect(logErrorSpy).toHaveBeenCalledWith(
      "Server Error Middleware",
      "Failed to destroy session after CSRF error",
      expect.anything(),
      req,
    );
    expect(redirect).toHaveBeenCalledWith("/session-timeout");
  });

  it("renders the generic 500 page for non-CSRF errors without destroying the session", () => {
    const destroy = mock();
    const redirect = mock();
    const render = mock();
    const req = { session: { destroy } } as unknown as Request;
    const res = { redirect, render } as unknown as Response;
    const next = mock() as NextFunction;

    serverErrors(new Error("something else went wrong"), req, res, next);

    expect(destroy).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
    expect(render).toHaveBeenCalledWith("errors/index", {
      status: 500,
      message: "Internal Server Error",
    });
  });
});
