import { checkAuthToken } from "#src/middleware/auth/auth-handler.js";
import applicationsRouter from "#src/routes/applications.router.js";
import authRouter from "#src/routes/auth.router.js";
import documentUploadRouter from "#src/routes/document-upload.router.js";
import paFormRouter from "#src/routes/pa-form.router.js";
import express from "express";
import type { NextFunction, Request, Response } from "express";

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

  next();
});

router.use(applicationsRouter);
router.use(paFormRouter);
router.use(documentUploadRouter);

router.get("/error", (req: Request, res: Response): void => {
  res.set("X-Error-Tag", "TEST_500_ALERT").status(500).render("errors/index");
});

export default router;
