import type { Request, Response } from "express";

export const getCounselLandingPage = (req: Request, res: Response): void => {
  res.render("priorAuthorityForm/counsel/counselLandingPage");
};

export const getCounselTypePage = (req: Request, res: Response): void => {
  res.render("priorAuthorityForm/counsel/counselType");
};

export const postCounselType = (
  req: Request,
  res: Response,
): void => {
  res.redirect("/prior-authority-form/counsel/justification");
};
