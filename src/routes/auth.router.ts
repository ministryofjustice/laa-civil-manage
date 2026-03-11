import express from "express";
import { login, logout, redirect } from "#src/middleware/auth/auth-handlers.js";

const authRouter = express.Router();

if (process.env.NODE_ENV !== "development") {
  authRouter.get("/login", login);
  authRouter.get("/redirect", redirect);
  authRouter.get("/logout", logout);
}

export default authRouter;
