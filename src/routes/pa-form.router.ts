import express from "express";
import type { Request, Response } from "#node_modules/@types/express/index.js";

const paFormRouter = express.Router();

// TODO This can be removed once the app has a landing page
paFormRouter.get("/", (req: Request, res: Response) => {
  res.render("pa-form/start-page.njk");
});

paFormRouter.get("/pa-form/start-page", (req: Request, res: Response) => {
  res.render("pa-form/start-page.njk");
});

paFormRouter.get("/pa-form/type-pa", (req: Request, res: Response) => {
  res.render("pa-form/type-pa.njk");
});

paFormRouter.get("/confirmation-page", (req, res) => {
  res.render("pa-form/confirmation-page");
});

export default paFormRouter;
