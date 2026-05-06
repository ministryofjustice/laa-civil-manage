import type { Request, Response } from "#node_modules/@types/express/index.js";

export const getStartPage = (req: Request, res: Response): void => {
  res.render("pa-form/start-page.njk");
};

export const getPaTypePage = (req: Request, res: Response): void => {
  res.render("pa-form/type-pa.njk");
};

export const postPriorAuthorityType = (req: Request, res: Response): void => {
  res.redirect("/pa-form/expert");
};

export const getConfirmationPage = (req: Request, res: Response): void => {
  res.render("pa-form/confirmation-page");
};
