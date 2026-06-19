import crypto from "node:crypto";
import type { ServerResponse } from "node:http";
import type { Application, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { config } from "#src/config.js";

const responseNonces = new WeakMap<ServerResponse, string>();

const nonceMiddleware = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const nonce = crypto.randomBytes(16).toString("base64");
  res.locals.cspNonce = nonce;
  responseNonces.set(res, nonce);
  next();
};

export const setupHelmet = (app: Application): void => {
  app.use(nonceMiddleware);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          scriptSrc: [
            "'self'",
            (_req, res) => {
              const nonce = responseNonces.get(res);
              return nonce ? `'nonce-${nonce}'` : "'self'";
            },
          ],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          fontSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
          upgradeInsecureRequests:
            config.app.environment === "development" ? null : [],
        },
      },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: "no-referrer" },
      hsts: config.app.environment === "development" ? false : undefined,
    }),
  );
};
