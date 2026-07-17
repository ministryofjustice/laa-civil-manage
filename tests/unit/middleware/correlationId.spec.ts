import { describe, it, expect } from "bun:test";
import type { Request, Response } from "express";
import {
  CORRELATION_ID_HEADER,
  correlationIdMiddleware,
  generateCorrelationId,
} from "#src/middleware/correlationId.js";
import { requestContext } from "#src/utils/requestContext.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mockRes(): { res: Response; headers: Record<string, string> } {
  const headers: Record<string, string> = {};
  const res = {
    setHeader: (name: string, value: string) => {
      headers[name] = value;
    },
  } as unknown as Response;
  return { res, headers };
}

describe("generateCorrelationId", () => {
  it("returns a UUID string", () => {
    expect(generateCorrelationId()).toMatch(UUID_RE);
  });
});

describe("correlationIdMiddleware", () => {
  it("generates a correlation ID, exposes it in context and echoes the header", () => {
    const req = { get: () => undefined, session: {} } as unknown as Request;
    const { res, headers } = mockRes();
    let seen: string | undefined;

    correlationIdMiddleware(req, res, () => {
      seen = requestContext.getStore()?.correlationId;
    });

    expect(seen).toMatch(UUID_RE);
    expect(seen).toBe(headers[CORRELATION_ID_HEADER]);
  });

  it("reuses an inbound correlation ID header", () => {
    const req = {
      get: (name: string) =>
        name === CORRELATION_ID_HEADER ? "inbound-abc" : undefined,
      session: {},
    } as unknown as Request;
    const { res, headers } = mockRes();
    let seen: string | undefined;

    correlationIdMiddleware(req, res, () => {
      seen = requestContext.getStore()?.correlationId;
    });

    expect(seen).toBe("inbound-abc");
    expect(headers[CORRELATION_ID_HEADER]).toBe("inbound-abc");
  });

  it("resolves the user id from the session lazily", () => {
    const req = {
      get: () => undefined,
      session: { userId: "user-42" },
    } as unknown as Request;
    const { res } = mockRes();
    let seen: string | undefined;

    correlationIdMiddleware(req, res, () => {
      seen = requestContext.getStore()?.getUserId();
    });

    expect(seen).toBe("user-42");
  });
});
