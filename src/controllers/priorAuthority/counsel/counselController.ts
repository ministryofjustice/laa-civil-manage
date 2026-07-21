import type { Request, Response } from "express";

const clearExpertJourneySessionData = (req: Request): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {} };

  req.session.priorAuthority = {
    ...req.session.priorAuthority,
    expert: {},
  };
};

export const getCounselLandingPage = (req: Request, res: Response): void => {
  clearExpertJourneySessionData(req);
  res.render("priorAuthorityForm/counsel/counselLandingPage");
};

export const getCounselTypePage = (req: Request, res: Response): void => {
  res.render("priorAuthorityForm/counsel/counselType");
};

export const postCounselType = (req: Request, res: Response): void => {
  res.redirect("/prior-authority-form/counsel/justification");
};
