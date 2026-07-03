// Extends express-serve-static-core so each request carries an authenticated
// Axios client (user's access token attached) for calling the backend API.
import type { AxiosInstance } from "#node_modules/axios/index.js";

declare module "express-serve-static-core" {
  interface Request {
    backend: AxiosInstance;
  }
}
