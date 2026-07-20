import type { Request, Response, NextFunction } from "express";

/**
 * Clears expert session data when the user enters the expert journey,
 * preventing stale expert data from a previous session contaminating the new one.
 */
export const clearExpertSession = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  req.session.priorAuthority = {
    ...req.session.priorAuthority,
    expert: {},
  };
  next();
};

/**
 * Clears counsel session data when the user enters the counsel journey,
 * preventing stale counsel data from a previous session contaminating the new one.
 */
export const clearCounselSession = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  req.session.priorAuthority = {
    ...req.session.priorAuthority,
    counsel: {},
  };
  next();
};
