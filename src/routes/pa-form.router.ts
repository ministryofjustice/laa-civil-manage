import express from "express";
import type { Request, Response } from "#node_modules/@types/express/index.js";

const paFormRouter = express.Router();

paFormRouter.get("/", (req: Request, res: Response) => {
  res.render("pa-form/start-page.njk");
});

export default paFormRouter;
