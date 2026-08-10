import type { NextFunction, Request, Response } from "express";
import { config } from "#src/config.js";
import { logger } from "#src/utils/logger.js";

/**
 * Enforces an absolute session lifetime (default 12 hours, configurable via
 * SESSION_ABSOLUTE_TIMEOUT_MS).
 *
 * Unlike the rolling idle timeout, this hard-expires sessions based on when
 * they were first created, preventing them from living indefinitely.
 */
export function absoluteTimeout(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.session.createdAt == null) {
    next();
    return;
  }

  const age = Date.now() - req.session.createdAt;

  if (age > config.session.absoluteTimeout) {
    logger.logInfo(
      "absoluteTimeout",
      `Session exceeded absolute timeout (age: ${age}ms) — destroying session`,
    );

    req.session.destroy((err: unknown) => {
      if (err != null) {
        logger.logError(
          "absoluteTimeout",
          "Failed to destroy expired session",
          err,
          req,
        );
      }

      res.clearCookie(config.session.name, { path: "/" });
      res.redirect("/auth/login");
    });

    return;
  }

  next();
}
