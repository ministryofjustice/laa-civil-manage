import { checkAuthToken } from "#src/middleware/auth/auth-handlers.js";
import applicationsRouter from "#src/routes/applications.router.js";
import authRouter from "#src/routes/auth.router.js";
import { checkRouter } from "#src/routes/checks.router.js";
import express from "express";
import type { Request, Response } from "express";

const router = express.Router();
if (process.env.NODE_ENV === "production") {
  router.use("/auth", authRouter);
  router.use(checkAuthToken);
}

router.get("/", (req: Request, res: Response): void => {
  res.render("main/index");
});

router.use(checkRouter);

router.use("/applications", applicationsRouter);

export default router;
