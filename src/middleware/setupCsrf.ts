import { csrfSync } from "csrf-sync";
import type { Request, Response, NextFunction } from "express";

const hasCSRFToken = (body: unknown): body is { _csrf: unknown } =>
  body !== null &&
  body !== undefined &&
  typeof body === "object" &&
  "_csrf" in body;

export const { csrfSynchronisedProtection } = csrfSync({
  getTokenFromRequest: (req: Request): string | undefined => {
    if (hasCSRFToken(req.body)) {
      return typeof req.body._csrf === "string" ? req.body._csrf : undefined;
    }
    return undefined;
  },
});

export const csrfTokenVariables = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (typeof req.csrfToken === "function") {
    res.locals.csrfToken = req.csrfToken();
  }
  next();
};
