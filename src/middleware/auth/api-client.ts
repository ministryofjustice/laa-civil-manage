import { AsyncLocalStorage } from "node:async_hooks";
import axios from "#node_modules/axios/index.js";
import type { NextFunction, Request, Response } from "express";

// Request-scoped store holding the signed-in user's access token, so `api` can
// attach it without threading a client through every controller and model.
const authContext = new AsyncLocalStorage<string>();

// Runs the rest of the request inside the auth context. When there is no token
// (e.g. unauthenticated routes), the request runs without one — any `api` call
// made in that state fails loudly via the interceptor below.
export function authContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = req.session.accessToken;
  if (token != null && token !== "") {
    authContext.run(token, next);
  } else {
    next();
  }
}

// The single client for the backend API. Every call is authenticated as the
// signed-in user — there is no unauthenticated variant. Import and use directly:
export const api = axios.create({ baseURL: process.env.BACKEND_URL });

api.interceptors.request.use((requestConfig) => {
  const token = authContext.getStore();
  if (token == null || token === "") {
    throw new Error(
      "No access token in request context — api can only be used on authenticated routes.",
    );
  }
  requestConfig.headers.set("Authorization", `Bearer ${token}`);
  return requestConfig;
});
