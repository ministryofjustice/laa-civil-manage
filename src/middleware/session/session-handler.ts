import type { NextFunction, Request, Response } from "express";

export function getSessionUrl(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.originalUrl.includes("/auth")) {
    req.session.originalUrl = req.originalUrl;
  }
  next();
}
