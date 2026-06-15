import type { PriorAuthority } from "#src/types/priorAuthority.js";
import type { Request, Response, NextFunction } from "express";
import "express-session";

export const saveToSession =
  <TBody, TKey extends keyof PriorAuthority>(
    sessionKey: TKey,
    extractValue: (body: TBody) => PriorAuthority[TKey],
  ) =>
  (
    req: Request<unknown, unknown, TBody>,
    res: Response,
    next: NextFunction,
  ): void => {
    const valueRead = extractValue(req.body);
    const priorAuthorityData: Partial<PriorAuthority> =
      req.session.priorAuthority ?? {};

    priorAuthorityData[sessionKey] = valueRead;

    req.session.priorAuthority = priorAuthorityData;

    next();
  };
