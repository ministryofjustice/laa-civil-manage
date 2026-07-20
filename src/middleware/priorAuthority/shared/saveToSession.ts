import type { PriorAuthority } from "#src/types/priorAuthority/shared.js";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import "express-session";

export function saveToSession<TBody, TKey extends keyof PriorAuthority>(
  sessionKey: TKey,
  extractValue: (
    body: TBody,
    priorAuthority: PriorAuthority,
  ) => PriorAuthority[TKey],
): RequestHandler<unknown, unknown, TBody> {
  return (
    req: Request<unknown, unknown, TBody>,
    _res: Response,
    next: NextFunction,
  ): void => {
    req.session.priorAuthority ??= { expert: {}, counsel: {} };
    const priorAuthority = req.session.priorAuthority;
    const value = extractValue(req.body, priorAuthority);
    priorAuthority[sessionKey] = value;
    req.session.priorAuthority = priorAuthority;
    next();
  };
}
