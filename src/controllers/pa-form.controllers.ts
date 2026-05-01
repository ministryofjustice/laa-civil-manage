import type { Request, Response } from "#node_modules/@types/express/index.js";
import type { PriorAuthorityType } from "#src/types/prior-authority.js";

export const getStartPage = (req: Request, res: Response): void => {
  res.render("pa-form/start-page.njk");
};


export const getPaTypePage = (req: Request, res: Response): void => {
  res.render("pa-form/type-pa.njk");
};

export const postPaTypePage = (req: Request<unknown,unknown, PriorAuthorityType>, res: Response): void => {
  const priorAuthroityType = req.body;
  req.session.priorAuthority = { type: priorAuthroityType };
};

export const getConfirmationPage = (req: Request, res: Response): void => {
  res.render("pa-form/confirmation-page");
};
