import type { Request, Response } from "#node_modules/@types/express/index.js";
import type { PriorAuthorityType } from "#src/types/prior-authority.js";

export const getStartPage = (req: Request, res: Response): void => {
  res.render("pa-form/start-page.njk");
};

export const getPaTypePage = (req: Request, res: Response): void => {
  res.render("pa-form/type-pa.njk");
};

export const postPriorAuthorityType = (
  req: Request<unknown, unknown, { PriorAuthorityType: PriorAuthorityType }>,
  res: Response,
): void => {
  const priorAuthorityType = req.body.PriorAuthorityType;
  req.session.priorAuthority = { type: priorAuthorityType };

  res.redirect("/pa-form/expert");
};

export const getConfirmationPage = (req: Request, res: Response): void => {
  res.render("pa-form/confirmation-page");
};

export const getSearchAnExpertTypePage = (req: Request, res: Response): void => {
  res.render("pa-form/search-an-expert-type.njk");
};
