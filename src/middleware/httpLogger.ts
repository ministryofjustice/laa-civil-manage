import { pinoHttp } from "pino-http";
import type { RequestHandler } from "express";
import type { IncomingMessage, ServerResponse } from "node:http";
import { baseLogger } from "#src/utils/logger.js";

export const httpLogger: RequestHandler = pinoHttp({
  logger: baseLogger,
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "silent";
  },
  autoLogging: {
    ignore: (req) =>
      !req.url || /^\/(?:css|js|assets|images|public)\//v.test(req.url),
  },
  serializers: {
    req: (req: IncomingMessage) => ({ method: req.method, url: req.url }),
    res: (res: ServerResponse) => ({ statusCode: res.statusCode }),
  },
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res) =>
    `${req.method} ${req.url} ${res.statusCode}`,
});
