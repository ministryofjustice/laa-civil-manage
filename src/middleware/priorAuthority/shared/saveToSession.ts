import type { PriorAuthorityCounsel } from "#src/types/priorAuthority/counsel.js";
import type { PriorAuthorityExpert } from "#src/types/priorAuthority/expert.js";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import "express-session";

export function saveToSession<TBody, TKey extends keyof PriorAuthorityExpert>(
  target: "priorAuthorityExpert",
  sessionKey: TKey,
  extractValue: (body: TBody) => PriorAuthorityExpert[TKey],
): RequestHandler<unknown, unknown, TBody>;

export function saveToSession<TBody, TKey extends keyof PriorAuthorityCounsel>(
  target: "priorAuthorityCounsel",
  sessionKey: TKey,
  extractValue: (body: TBody) => PriorAuthorityCounsel[TKey],
): RequestHandler<unknown, unknown, TBody>;

export function saveToSession<TBody>(
  target: "priorAuthorityType",
  sessionKey: "priorAuthorityType",
  extractValue: (body: TBody) => string,
): RequestHandler<unknown, unknown, TBody>;

export function saveToSession(
  target:
    | "priorAuthorityExpert"
    | "priorAuthorityCounsel"
    | "priorAuthorityType",
  sessionKey: string,
  extractValue: (body: unknown) => unknown,
) {
  return (
    req: Request<unknown, unknown>,
    _res: Response,
    next: NextFunction,
  ): void => {
    const value = extractValue(req.body);

    if (target === "priorAuthorityExpert") {
      const data = req.session.priorAuthorityExpert ?? {};
      (data as Record<string, unknown>)[sessionKey] = value;
      req.session.priorAuthorityExpert = data;
      next();
      return;
    }

    if (target === "priorAuthorityType") {
      req.session.priorAuthorityType = String(value);
      next();
      return;
    }

    const data = req.session.priorAuthorityCounsel ?? {};
    (data as Record<string, unknown>)[sessionKey] = value;
    req.session.priorAuthorityCounsel = data;
    next();
  };
}
