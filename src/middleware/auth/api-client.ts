import { AsyncLocalStorage } from "node:async_hooks";
import axios from "#node_modules/axios/index.js";
import type { NextFunction, Request, Response } from "express";

const authContext = new AsyncLocalStorage<string>();

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

export const api = axios.create({ baseURL: process.env.BACKEND_URL });

api.interceptors.request.use((requestConfig) => {
  if (process.env.SKIP_AUTH === "true") {
    return requestConfig;
  }

  const token = authContext.getStore();
  if (token == null || token === "") {
    throw new Error(
      "No access token in request context — api can only be used on authenticated routes.",
    );
  }
  requestConfig.headers.set("Authorization", `Bearer ${token}`);
  return requestConfig;
});
