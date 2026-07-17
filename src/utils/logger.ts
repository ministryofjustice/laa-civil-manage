import { config } from "#src/config.js";
import type { Request } from "express";
import { isAxiosError } from "axios";
import { isAxiosErrResponse } from "#src/utils/errors.js";
import pino from "pino";
import type { DestinationStream, Logger as PinoLogger } from "pino";
import {
  getContextUserId,
  getCorrelationId,
} from "#src/utils/requestContext.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface OpenSearchLog {
  timestamp: string;
  level: string;
  serviceName: string;
  environment: string;
  correlationId?: string;
  message: string;
  context: {
    userId?: string;
    functionName: string;
  };
}

export interface TypedRequestBody<T> extends Express.Request {
  body: T;
}
export interface TypedRequest<T, V> extends Express.Request {
  body: T;
  params: V;
}
export interface IdParams {
  id: string;
}

/**
 * Fields that must never appear in logs. If accidentally passed,
 * Pino's redaction will automatically replace them with `[REDACTED]`.
 */
const REDACT_PATHS = [
  "context.accessToken",
  "context.idToken",
  "context.token",
  "context.password",
  "req.headers.authorization",
  "req.headers.cookie",
  'res.headers["set-cookie"]',
];

export function buildLoggerOptions(): pino.LoggerOptions {
  const usePretty =
    process.env.LOG_PRETTY === "true" &&
    config.app.environment !== "production" &&
    config.app.environment !== "test";

  return {
    level: process.env.LOG_LEVEL ?? "info",
    messageKey: "message",
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    formatters: { level: (label) => ({ level: label }) },
    base: {
      serviceName: config.SERVICE_NAME,
      environment: config.app.environment,
    },
    mixin: () => {
      const correlationId = getCorrelationId();
      return correlationId ? { correlationId } : {};
    },
    redact: { paths: REDACT_PATHS, censor: "[REDACTED]" },
    ...(usePretty && {
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          messageKey: "message",
          ignore: "serviceName,environment",
        },
      },
    }),
  };
}

export function createBaseLogger(
  destination: DestinationStream = process.stdout,
): PinoLogger {
  const options = buildLoggerOptions();
  return options.transport != null ? pino(options) : pino(options, destination);
}

export const baseLogger = createBaseLogger();

class Logger {
  readonly #pino: PinoLogger;

  constructor(instance: PinoLogger = baseLogger) {
    this.#pino = instance;
  }

  public logDebug = (
    functionName: string,
    message: string,
    request?: Request | TypedRequestBody<unknown>,
  ): void => {
    this.#pino.debug(this.#context(functionName, request), message);
  };

  public logInfo = (
    functionName: string,
    message: string,
    request?: Request | TypedRequestBody<unknown>,
  ): void => {
    this.#pino.info(this.#context(functionName, request), message);
  };

  public logWarn = (
    functionName: string,
    message: string,
    request?: Request | TypedRequestBody<unknown>,
  ): void => {
    this.#pino.warn(this.#context(functionName, request), message);
  };

  public logError = (
    functionName: string,
    message: string,
    err?: unknown,
    request?: Request | TypedRequestBody<unknown>,
  ): void => {
    this.#pino.error(
      this.#context(functionName, request),
      `${message} - Error: ${this.#getErrorMessage(err)}`,
    );
  };

  #context(
    functionName: string,
    request?: Request | TypedRequestBody<unknown>,
  ): { context: OpenSearchLog["context"] } {
    const userId = request?.session.userId ?? getContextUserId();
    return { context: { userId: userId ?? "none", functionName } };
  }

  #getErrorMessage(err: unknown): string {
    if (typeof err === "string") return err;

    if (isAxiosError(err)) {
      return isAxiosErrResponse(err.response)
        ? `CODE: ${err.code} - HTTP ${err.response.status}`
        : `CODE: ${err.code}`;
    }

    return err instanceof Error ? err.message : "Missing Error Message";
  }
}

export const logger = new Logger();
export { Logger };
