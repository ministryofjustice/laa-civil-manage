import axios from "#node_modules/axios/index.js";
import type { NextFunction, Request, Response } from "express";

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
