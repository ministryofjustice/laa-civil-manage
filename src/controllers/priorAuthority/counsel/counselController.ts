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

export const getCounselJustificationPage = (
  req: Request,
  res: Response,
): void => {
  res.render("priorAuthorityForm/justificationPage", {
    backLinkHref: "/prior-authority-form/counsel/type",
    formAction: "/prior-authority-form/counsel/justification",
    hintText:
      "Provide a background to the case that demonstrates relevant circumstances and explanation of the specific expertise required.",
  });
};

export const postCounselJustification = (
  _req: Request,
  res: Response,
): void => {
  res.redirect("/prior-authority-form/counsel/document-upload");
};
