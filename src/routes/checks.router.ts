import express from "express";
import type { Request, Response } from "express";

export const checkRouter = express.Router();

checkRouter.get("/status", (req: Request, res: Response): void => {
  res.status(200).send("OK");
});

checkRouter.get("/health", (req: Request, res: Response): void => {
  res.status(200).send("Healthy");
});

checkRouter.get("/error", (req: Request, res: Response): void => {
  res
    .set("X-Error-Tag", "TEST_500_ALERT")
    .status(500)
    .send("Internal Server Error");
});
