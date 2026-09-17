import type {
  NextFunction,
  Request,
  Response,
} from "#node_modules/@types/express/index.js";
import { logger } from "#src/utils/logger.js";

export const routeNotFound = (_: Request, res: Response): void => {
  res.status(404).render("errors/notFound", {
    status: 404,
    message: "Page not found",
  });
};

const isCsrfTokenError = (err: unknown): boolean =>
  typeof err === "object" &&
  err !== null &&
  "code" in err &&
  (err as { code?: unknown }).code === "EBADCSRFTOKEN";

export const serverErrors = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (isCsrfTokenError(err)) {
    logger.logInfo(
      "Server Error Middleware",
      "CSRF token invalid — likely expired session, destroying session and redirecting to timeout page",
      req,
    );

    req.session.destroy((destroyErr: unknown) => {
      if (destroyErr != null) {
        logger.logError(
          "Server Error Middleware",
          "Failed to destroy session after CSRF error",
          destroyErr,
          req,
        );
      }

      res.redirect("/session-timeout");
    });
    return;
  }

  logger.logError("Server Error Middleware", "Internal Server Error", err, req);
  res.render("errors/index", { status: 500, message: "Internal Server Error" });
};
