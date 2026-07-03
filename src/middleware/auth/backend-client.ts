import axios from "#node_modules/axios/index.js";
import type { NextFunction, Request, Response } from "express";

// Builds a per-request Axios client with the user's access token baked in and
// attaches it to req.backend. Models that need to call the backend on behalf of
// the user take this client; endpoints that should stay unauthenticated keep
// using the plain axios import instead.
export function attachBackendClient(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = req.session.accessToken;

  req.backend = axios.create({
    baseURL: process.env.BACKEND_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  next();
}
