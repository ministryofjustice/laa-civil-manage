import { checkAuthToken } from "#src/middleware/auth/authHandler.js";
import authRouter from "#src/routes/authRouter.js";
import documentUploadRouter from "#src/routes/documentUploadRouter.js";
import priorAuthorityFormRouter from "#src/routes/priorAuthorityFormRouter.js";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import { rateLimiter } from "#src/middleware/rateLimiter.js";
import { getStartPage } from "#src/controllers/priorAuthorityFormController.js";

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
} else {
  router.use((req: Request, res: Response, next: NextFunction) => {
    req.session.userId ??= "00000000-0000-0000-0000-000000000001";
    req.session.userDisplayName ??= "Dev User";
    next();
  });
}
router.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.priorAuthority = req.session.priorAuthority ?? {};
  res.locals.user = req.session.userDisplayName
    ? { displayName: req.session.userDisplayName }
    : null;

  next();
});

router.use(rateLimiter);
// TODO This can be removed once the app has a landing page
router.get("/", getStartPage);

router.use("/prior-authority-form", priorAuthorityFormRouter);
router.use(documentUploadRouter);

router.get("/error", (req: Request, res: Response): void => {
  res.set("X-Error-Tag", "TEST_500_ALERT").status(500).render("errors/index");
});

export default router;
