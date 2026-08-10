import { describe, it, expect, mock, beforeEach } from "bun:test";
import type { NextFunction, Request, Response } from "express";
import { absoluteTimeout } from "#src/middleware/session/absoluteTimeout.js";
import { config } from "#src/config.js";

interface SessionStub {
  createdAt: number | undefined;
  destroy: ReturnType<typeof mock>;
}

interface ResStub {
  clearCookie: ReturnType<typeof mock>;
  redirect: ReturnType<typeof mock>;
}

const makeSession = (
  overrides: Partial<{ createdAt: number }> = {},
): SessionStub => ({
  createdAt: overrides.createdAt,
  destroy: mock((cb: (err: unknown) => void) => {
    cb(null);
  }),
});

const makeReq = (sessionOverrides?: Partial<{ createdAt: number }>): Request =>
  ({
    session: makeSession(sessionOverrides),
    sessionID: "test-session-id",
  }) as unknown as Request;

const makeRes = (): Response => {
  const res: ResStub = {
    clearCookie: mock((_name: string) => res),
    redirect: mock((_url: string) => res),
  };
  return res as unknown as Response;
};

const ABSOLUTE_TIMEOUT_MS = config.session.absoluteTimeout;

describe("absoluteTimeout middleware (CM-469)", () => {
  let next: NextFunction;

  beforeEach(() => {
    next = mock() as NextFunction;
  });

  it("calls next() when the session has no createdAt (unauthenticated or legacy session)", () => {
    const req = makeReq();
    const res = makeRes();

    absoluteTimeout(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((res as unknown as ResStub).redirect).not.toHaveBeenCalled();
  });

  it("calls next() for a session within the absolute timeout window", () => {
    const req = makeReq({ createdAt: Date.now() - 1000 });
    const res = makeRes();

    absoluteTimeout(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((res as unknown as ResStub).redirect).not.toHaveBeenCalled();
  });

  it("calls next() for a session exactly at the timeout boundary (edge: not yet exceeded)", () => {
    const req = makeReq({ createdAt: Date.now() - ABSOLUTE_TIMEOUT_MS + 1 });
    const res = makeRes();

    absoluteTimeout(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((res as unknown as ResStub).redirect).not.toHaveBeenCalled();
  });

  it("destroys the session and redirects to /auth/login when createdAt exceeds the absolute timeout", () => {
    const req = makeReq({ createdAt: Date.now() - ABSOLUTE_TIMEOUT_MS - 1 });
    const res = makeRes();

    absoluteTimeout(req, res, next);

    expect(next).not.toHaveBeenCalled();
    const { destroy } = req.session as unknown as SessionStub;
    expect(destroy).toHaveBeenCalledTimes(1);
    expect((res as unknown as ResStub).redirect).toHaveBeenCalledWith(
      "/auth/login",
    );
  });

  it("clears the session cookie by name (not session ID) with Path=/ when the session has expired", () => {
    const req = makeReq({
      createdAt: Date.now() - ABSOLUTE_TIMEOUT_MS - 1000,
    });
    const res = makeRes();

    absoluteTimeout(req, res, next);

    expect((res as unknown as ResStub).clearCookie).toHaveBeenCalledWith(
      config.session.name,
      { path: "/" },
    );
  });

  it("still redirects to /auth/login even when session.destroy() errors", () => {
    const req = makeReq({ createdAt: Date.now() - ABSOLUTE_TIMEOUT_MS - 1 });
    const { destroy } = req.session as unknown as SessionStub;
    destroy.mockImplementation((cb: (err: unknown) => void) => {
      cb(new Error("Redis unavailable"));
    });
    const res = makeRes();

    absoluteTimeout(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect((res as unknown as ResStub).redirect).toHaveBeenCalledWith(
      "/auth/login",
    );
  });

  it("does not call next() after redirecting an expired session", () => {
    const req = makeReq({
      createdAt: Date.now() - ABSOLUTE_TIMEOUT_MS - 5000,
    });
    const res = makeRes();

    absoluteTimeout(req, res, next);

    expect(next).not.toHaveBeenCalled();
  });
});
