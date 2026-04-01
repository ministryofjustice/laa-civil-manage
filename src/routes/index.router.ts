import { checkAuthToken } from "#src/middleware/auth/auth-handlers.js";
import applicationsRouter from "#src/routes/applications.router.js";
import authRouter from "#src/routes/auth.router.js";
import paFormRouter from "#src/routes/pa-form.router.js";
import express from "express";
import type { Request, Response } from "express";

const router = express.Router();
const SUCCESSFUL_REQUEST = 200;
const UNSUCCESSFUL_REQUEST = 500;

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

router.use(applicationsRouter);
router.use(paFormRouter);

router.get("/error", (req: Request, res: Response): void => {
  res
    .set("X-Error-Tag", "TEST_500_ALERT")
    .status(UNSUCCESSFUL_REQUEST)
    .send("Internal Server Error");
});

router.get("/apply-sca-and-other", (req: Request, res: Response): void => {
  res.render("main/what-type-of-pa");
});

export default router;
