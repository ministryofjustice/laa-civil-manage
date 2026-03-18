import type { Application } from "express";
import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { config } from "../config.js";
import promBundle from "express-prom-bundle";

/**
 * Sets up common middlewares for the given Express application.
 *
 * @param {Application} app - The Express application instance.
 * @returns {void} Sets up various middleware on the provided app instance.
 */
export const setupMiddlewares = (app: Application): void => {
  // Prometheus metrics middleware configuration
  const metricsMiddleware = promBundle({
    includeMethod: true,
    includePath: true,
    includeStatusCode: true,
    normalizePath: [
      ["^/user/.*", "/user/#id"], // Group similar paths to avoid high cardinality
    ],
    promClient: {
      collectDefaultMetrics: {}, // Collects CPU, memory, etc.
    },
  });

  app.use(metricsMiddleware);

  // Parses cookies and adds them to req.cookies
  app.use(cookieParser());

  // Parses URL-encoded bodies (form submissions)
  app.use(bodyParser.urlencoded({ extended: true }));

  // Serve static files from the specified public directory
  app.use(express.static(config.paths.static));

  // Parses JSON request bodies
  app.use(express.json());

  // Parses URL-encoded bodies
  app.use(express.urlencoded({ extended: false }));
};
