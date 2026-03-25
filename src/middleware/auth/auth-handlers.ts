import { config } from "#src/config.js";
import type { NextFunction, Request, Response } from "express";
import jwksClient from "jwks-rsa";
import type { JwksClientFunction } from "#src/types/sessions.js";
import msalClient from "#src/middleware/auth/auth-client.js";
import { logger } from "#src/utils/logger.js";
import verifyToken from "#src/middleware/auth/verify-token.js";

const allowedPaths = ["/", "/test-url"];

async function checkAuthToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  await checkIfValidSession(req, res, next, verifyToken);
}

async function checkIfValidSession(
  req: Request,
  res: Response,
  next: NextFunction,
  verifyToken: (
    req: Request,
    token: string,
    jwksClient: JwksClientFunction,
  ) => Promise<boolean>,
): Promise<void> {
  const authPaths = ["/auth/login", "/auth/redirect"];

  if (authPaths.includes(req.path)) {
    next();
    return;
  }

  if (!req.session.idToken) {
    res.redirect("/auth/login");
    return;
  }
  if (!(await verifyToken(req, req.session.idToken, jwksClient))) {
    res.redirect("/auth/login");
    return;
  }
  next();
}

async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authCodeUrlParams = {
    scopes: ["user.read", "offline_access"],
    redirectUri: config.auth.redirectUri,
    authority: config.auth.authDirectory,
  };
  try {
    const authCodeUrl = await msalClient.getAuthCodeUrl(authCodeUrlParams);
    res.redirect(authCodeUrl);
  } catch (err: unknown) {
    logger.logError("Login", "Error while getting auth code URL", err, req);
    next(err);
  }
}

async function redirect(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (typeof req.query.code !== "string") {
      throw new Error("Invalid code type in authorisation request.");
    }
    const { code } = req.query;

    const tokenRequest = {
      code,
      scopes: ["user.read", "offline_access"],
      redirectUri: config.auth.redirectUri,
      accessType: "offline",
    };

    const tokenResponse = await msalClient.acquireTokenByCode(tokenRequest);

    req.session.idToken = tokenResponse.idToken;
    req.session.accessToken = tokenResponse.accessToken;
    req.session.userId = tokenResponse.account?.localAccountId;
    req.session.userDisplayName = tokenResponse.account?.name;

    const target =
      typeof req.session.originalUrl === "string" &&
      allowedPaths.includes(req.session.originalUrl)
        ? req.session.originalUrl
        : "/";

    req.session.save((err: unknown) => {
      if (err !== undefined && err !== null) {
        logger.logError("Redirect", "Failed to save session", err, req);
        next(err);
      }
    });

    res.redirect(target || "/");
  } catch (err: unknown) {
    logger.logError("Redirect", "Error while redirecting", err, req);
    next(err);
  }
}

function logout(req: Request, res: Response, next: NextFunction): void {
  req.session.destroy((err: unknown) => {
    if (err !== undefined && err !== null) {
      logger.logError(
        "Logout",
        "Error destroying session during logout",
        err,
        req,
      );
      next(err);
      return;
    }

    res.redirect("/");
  });
}

export { checkAuthToken, login, redirect, logout, checkIfValidSession };
