import { config } from "#src/config.js";
import type { NextFunction, Request, Response } from "express";
import jwksClient from "jwks-rsa";
import type { JwksClientFunction } from "#src/types/sessions.js";
import msalClient from "#src/middleware/auth/authClient.js";
import { logger } from "#src/utils/logger.js";
import verifyToken from "#src/middleware/auth/verifyToken.js";

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
    scopes: [config.auth.apiScope, "offline_access"],
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

function checkEntraError(query: Request["query"]): void {
  if (typeof query.error === "string") {
    const errorDescription =
      typeof query.error_description === "string"
        ? query.error_description
        : "No description provided";

    throw new Error(`Entra Auth Failed: ${query.error} - ${errorDescription}`);
  }
}

function getTargetPath(session: Request["session"]): string {
  return typeof session.originalUrl === "string" &&
    allowedPaths.includes(session.originalUrl)
    ? session.originalUrl
    : "/";
}

async function redirect(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    checkEntraError(req.query);

    if (typeof req.query.code !== "string") {
      throw new Error("Invalid code type in authorisation request.");
    }

    const tokenRequest = {
      code: req.query.code,
      scopes: [config.auth.apiScope, "offline_access"],
      redirectUri: config.auth.redirectUri,
      accessType: "offline",
    };

    const tokenResponse = await msalClient.acquireTokenByCode(tokenRequest);

    if (
      typeof tokenResponse.accessToken === "string" &&
      tokenResponse.accessToken !== ""
    ) {
      req.session.accessToken = tokenResponse.accessToken;
      req.session.idToken = tokenResponse.idToken;
      req.session.userId = tokenResponse.account?.localAccountId;
      req.session.userDisplayName = tokenResponse.account?.name;
    }

    res.redirect(getTargetPath(req.session));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.logError(
      "Auth Handler Error",
      `Token acquisition failed: ${errorMessage}`,
    );
    next(error);
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

    const params = new URLSearchParams({
      post_logout_redirect_uri: config.auth.logoutRedirectUri,
    });
    res.redirect(
      `${config.auth.authDirectory}/oauth2/v2.0/logout?${params.toString()}`,
    );
  });
}

export { checkAuthToken, login, redirect, logout, checkIfValidSession };
