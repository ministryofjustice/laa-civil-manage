import type { Request, Response, NextFunction } from "express";
import { getApplicationFromSession } from "#src/middleware/priorAuthority/shared/applicationSession.js";

export const loadApplicationReference = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  res.locals.laaReference = getApplicationFromSession(req)?.laaReference;
  next();
};
