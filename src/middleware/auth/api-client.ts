import { AsyncLocalStorage } from "node:async_hooks";
import axios from "#node_modules/axios/index.js";
import type { NextFunction, Request, Response } from "express";
import { getCorrelationId } from "#src/utils/requestContext.js";
import { CORRELATION_ID_HEADER } from "#src/middleware/correlationId.js";
import { logger } from "#src/utils/logger.js";

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

api.interceptors.request.use((requestConfig) => {
  const correlationId = getCorrelationId();
  if (correlationId != null && correlationId !== "") {
    requestConfig.headers.set(CORRELATION_ID_HEADER, correlationId);
  }
  return requestConfig;
});

api.interceptors.response.use(
  (response) => {
    logger.logInfo(
      "apiClient",
      `Backend API: ${response.config.method?.toUpperCase()} ${response.config.url} ${response.status}`,
    );
    return response;
  },
  async (error: unknown) => {
    let status = "Unknown";
    if (axios.isAxiosError(error)) {
      status = String(error.response?.status ?? "Network");
    }

    logger.logWarn("apiClient", `Backend API Request Failed - HTTP ${status}`);
    return await Promise.reject(error);
  },
);
