import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { requestContext } from "#src/utils/requestContext.js";

export const CORRELATION_ID_HEADER = "X-Correlation-ID";

export function generateCorrelationId(): string {
  try {
    return Bun.randomUUIDv7();
  } catch {
    return randomUUID();
  }
}

export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const rawInbound = req.get(CORRELATION_ID_HEADER);
  const inbound = rawInbound?.trim().substring(0, 50);
  const correlationId = inbound || generateCorrelationId();

  res.setHeader(CORRELATION_ID_HEADER, correlationId);
  requestContext.run(
    { correlationId, getUserId: () => req.session.userId },
    next,
  );
}
