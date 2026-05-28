import { checkAuthToken } from "#src/middleware/auth/auth-handler.js";
import authRouter from "#src/routes/auth.router.js";
import documentUploadRouter from "#src/routes/document-upload.router.js";
import paFormRouter from "#src/routes/pa-form.router.js";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import { rateLimiter } from "#src/middleware/rateLimiter.js";

const router = express.Router();
const SUCCESSFUL_REQUEST = 200;

if (process.env.SKIP_AUTH !== "true") {
  router.use("/auth", authRouter);
}

router.get("/status", (req: Request, res: Response): void => {
  res.status(SUCCESSFUL_REQUEST).send("OK");
});

router.get("/health", (req: Request, res: Response): void => {
  res.status(SUCCESSFUL_REQUEST).send("Healthy");
});

if (process.env.SKIP_AUTH !== "true") {
  router.use(checkAuthToken);
}
router.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.priorAuthority = req.session.priorAuthority ?? {};
  res.locals.user = req.session.userDisplayName
    ? { displayName: req.session.userDisplayName }
    : null;

  next();
});

router.use(rateLimiter);
router.use(paFormRouter);
router.use(documentUploadRouter);

router.get("/error", (req: Request, res: Response): void => {
  res.set("X-Error-Tag", "TEST_500_ALERT").status(500).render("errors/index");
});

export default router;
