import type { Request, Response } from "#node_modules/@types/express/index.js";

export const getStartPage = (req: Request, res: Response): void => {
  res.render("pa-form/start-page.njk");
};

export const getPaTypePage = (req: Request, res: Response): void => {
  res.render("pa-form/type-pa.njk");
};

export const postPriorAuthorityType = (req: Request, res: Response): void => {
  res.redirect("/pa-form/expert-details");
};

export const getConfirmationPage = (req: Request, res: Response): void => {
  res.render("pa-form/confirmation-page");
};

export const getExpertDetailsPage = (req: Request, res: Response): void => {
  res.render("pa-form/expert-details");
};

export const postExpertDetails = (req: Request, res: Response): void => {
  res.redirect("/pa-form/document-upload");
};
