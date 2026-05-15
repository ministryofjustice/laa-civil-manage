import type { Application } from "express";
import express from "express";
import cookieParser from "cookie-parser";
import promBundle from "express-prom-bundle";
import { config } from "#src/config.js";

export const setupMiddlewares = (app: Application): void => {
  const metricsMiddleware = promBundle({
    includeMethod: true,
    includePath: true,
    includeStatusCode: true,
    normalizePath: [["^/user/.*", "/user/#id"]],
    promClient: {
      collectDefaultMetrics: {},
    },
  });

  app.use(metricsMiddleware);

  // Parses cookies and adds them to req.cookies
  app.use(cookieParser());

  // Serve static files from the specified public directory
  app.use(express.static(config.paths.static));

  // Parses JSON request bodies
  app.use(express.json());

  // Parses URL-encoded bodies
  app.use(express.urlencoded({ extended: false }));
};
