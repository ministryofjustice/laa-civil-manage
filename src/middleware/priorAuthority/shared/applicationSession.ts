import type { Request } from "express";
import "express-session";
import type { ApplicationSummary } from "#src/types/applications.js";

/**
 * Stores the parent application on the session so the prior authority flow can
 * reference it (e.g. for the summary and back link on the apply page, and the
 * applicationId when submitting).
 */
export const setApplicationInSession = (
  req: Request,
  application: ApplicationSummary,
): void => {
  req.session.application = application;
};

export const getApplicationFromSession = (
  req: Request,
): ApplicationSummary | undefined => req.session.application;

/**
 * The single, verified way to remove the application from the session. Call
 * this whenever the prior authority flow ends (submission or cancellation) so
 * a stale application can never leak into a later flow.
 */
export const clearApplicationFromSession = (req: Request): void => {
  req.session.application = undefined;
};
