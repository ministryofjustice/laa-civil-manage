import express from "express";
import { login, logout, redirect } from "#src/middleware/auth/authHandler.js";

const authRouter = express.Router();

authRouter.get("/login", login);
authRouter.get("/redirect", redirect);
authRouter.get("/logout", logout);

export default authRouter;
