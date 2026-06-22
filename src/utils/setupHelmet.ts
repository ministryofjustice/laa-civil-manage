import crypto from "node:crypto";
import type { ServerResponse } from "node:http";
import type { Application, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { config } from "#src/config.js";
import { logger } from "#src/utils/logger.js";

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

interface HttpsEnforcementSettings {
  nodeEnv: string;
  enableHttpsEnforcementRaw: string | undefined;
  enableHttpsEnforcement: boolean;
}

const getRuntimeEnv = (): NodeJS.ProcessEnv => globalThis.process.env;

const resolveHttpsEnforcementSettings = (): HttpsEnforcementSettings => {
  const runtimeEnv = getRuntimeEnv();
  const nodeEnv = runtimeEnv.NODE_ENV ?? config.app.environment;
  const enableHttpsEnforcementRaw = runtimeEnv.ENABLE_HTTPS_ENFORCEMENT;

  const enableHttpsEnforcement =
    enableHttpsEnforcementRaw === "true" ||
    (enableHttpsEnforcementRaw !== "false" && nodeEnv === "production");

  return {
    nodeEnv,
    enableHttpsEnforcementRaw,
    enableHttpsEnforcement,
  };
};

export const setupHelmet = (app: Application): void => {
  const { nodeEnv, enableHttpsEnforcementRaw, enableHttpsEnforcement } =
    resolveHttpsEnforcementSettings();

  logger.logInfo(
    "setupHelmet",
    `HTTPS enforcement settings: NODE_ENV=${nodeEnv}, ENABLE_HTTPS_ENFORCEMENT=${enableHttpsEnforcementRaw ?? "undefined"}, computedEnableHttpsEnforcement=${String(enableHttpsEnforcement)}`,
  );

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
          upgradeInsecureRequests: enableHttpsEnforcement ? [] : null,
        },
      },
      hsts: enableHttpsEnforcement,
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: "no-referrer" },
    }),
  );
};
