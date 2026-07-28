import { csrfSync } from "csrf-sync";
import type { Application, Request, Response, NextFunction } from "express";

const hasCSRFToken = (target: unknown): target is { _csrf: unknown } =>
  target !== null &&
  target !== undefined &&
  typeof target === "object" &&
  "_csrf" in target;

const { csrfSynchronisedProtection } = csrfSync({
  getTokenFromRequest: (req: Request): string | undefined => {
    if (hasCSRFToken(req.body) && typeof req.body._csrf === "string") {
      return req.body._csrf;
    }

    if (hasCSRFToken(req.query) && typeof req.query._csrf === "string") {
      return req.query._csrf;
    }

    const xCsrfToken = req.headers["x-csrf-token"];
    if (typeof xCsrfToken === "string") {
      return xCsrfToken;
    }

    const csrfToken = req.headers["csrf-token"];
    if (typeof csrfToken === "string") {
      return csrfToken;
    }

    return undefined;
  },
});

export const setupCsrf = (app: Application): void => {
  // POST document-upload is multipart/form-data: multer must parse the body
  // first so the hidden _csrf field is readable. Those routes validate CSRF themselves.
  app.use((req: Request, res: Response, next: NextFunction): void => {
    if (
      req.method === "POST" &&
      /^\/prior-authority\/(?:expert|counsel)\/document-upload$/v.test(req.path)
    ) {
      next();
      return;
    }
    csrfSynchronisedProtection(req, res, next);
  });

  app.use((req: Request, res: Response, next: NextFunction): void => {
    if (typeof req.csrfToken === "function") {
      res.locals.csrfToken = req.csrfToken();
    } else if (typeof req.session.csrfToken === "string") {
      res.locals.csrfToken = req.session.csrfToken;
    }
    next();
  });
};
