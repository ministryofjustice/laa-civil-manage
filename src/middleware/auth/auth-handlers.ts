import { config } from "#config.js";
import type { NextFunction, Request, Response } from "express";
import jwksClient from "jwks-rsa";
import type { JwksClientFunction } from "#src/types/sessions.js";
import msalClient from "#src/middleware/auth/auth-client.js";
import { logger } from "#src/utils/logger.js";
import verifyToken from "#src/middleware/auth/verify-token.js";

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
  if (req.path.startsWith("/mock-data")) {
    logger.logInfo("Auth Handler", "No Auth needed on Mock Data"); // This is temp until we integrate with Data Store
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
      await Promise.reject({
        status: 400,
        msg: "Invalid code type in authorisation request.",
      });
      return;
    }
    const {
      query: { code },
    } = req;

    const tokenRequest = {
      code, // Code received in the redirect
      scopes: ["user.read", "offline_access"], // Include offline_access to get refresh token
      redirectUri: config.auth.redirectUri,
      accessType: "offline", // Ensure offline access to get the refresh token
      tokenBodyParameters: {
        client_secret: config.auth.clientSecret, // Include client secret for confidential clients
      },
    };
    const tokenResponse = await msalClient.acquireTokenByCode(tokenRequest);
    // Store tokens in cookies
    // eslint-disable-next-line no-param-reassign
    req.session.idToken = tokenResponse.idToken;
    // eslint-disable-next-line no-param-reassign
    req.session.accessToken = tokenResponse.accessToken;
    // eslint-disable-next-line no-param-reassign
    req.session.userId = tokenResponse.account?.localAccountId;
    // eslint-disable-next-line no-param-reassign
    req.session.userDisplayName = tokenResponse.account?.name;
    res.redirect(req.session.originalUrl || "/applications");
  } catch (err: unknown) {
    logger.logError("Redirect", "Error while redirecting", err, req);
    next(err);
  }
}

function logout(req: Request, res: Response, next: NextFunction): void {
  req.session.destroy((err: unknown) => {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (err) {
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
