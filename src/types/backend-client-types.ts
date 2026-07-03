import type { AxiosInstance } from "#node_modules/axios/index.js";

declare module "express-serve-static-core" {
  interface Request {
    backend: AxiosInstance;
  }
}
