import type { NextFunction, Request, Response } from "express";

export function getSessionUrl(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.originalUrl.includes("/auth")) {
    //eslint-disable-next-line no-param-reassign
    req.session.originalUrl = req.originalUrl;
  }
  next();
}
