import type { PriorAuthority } from "#src/types/priorAuthority/shared.js";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import "express-session";

export function saveToSession<TBody, TKey extends keyof PriorAuthority>(
  sessionKey: TKey,
  extractValue: (body: TBody) => PriorAuthority[TKey],
): RequestHandler<unknown, unknown, TBody>;

export function saveToSession(
  sessionKey: string,
  extractValue: (body: unknown) => unknown,
) {
  return (
    req: Request<unknown, unknown>,
    _res: Response,
    next: NextFunction,
  ): void => {
    const value = extractValue(req.body);
    const data = req.session.priorAuthority ?? {};
    (data as Record<string, unknown>)[sessionKey] = value;
    req.session.priorAuthority = data;
    next();
  };
}
