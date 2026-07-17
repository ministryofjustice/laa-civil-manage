import type { PriorAuthority } from "#src/types/priorAuthority/shared.js";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import "express-session";

export function saveToSession<TBody, TKey extends keyof PriorAuthority>(
  sessionKey: TKey,
  extractValue: (body: TBody) => PriorAuthority[TKey],
): RequestHandler<unknown, unknown, TBody> {
  return (
    req: Request<unknown, unknown, TBody>,
    _res: Response,
    next: NextFunction,
  ): void => {
    const value = extractValue(req.body);
    const data: PriorAuthority = req.session.priorAuthority ?? {};
    data[sessionKey] = value;
    req.session.priorAuthority = data;
    next();
  };
}
