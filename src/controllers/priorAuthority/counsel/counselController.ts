import type { Request, Response } from "express";

const startCounselJourney = (req: Request): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {} };

  req.session.priorAuthority = {
    ...req.session.priorAuthority,
    type: "Counsel",
    expert: {},
  };
};

export const getCounselLandingPage = (req: Request, res: Response): void => {
  startCounselJourney(req);
  res.render("priorAuthority/counsel/counselLandingPage");
};

export const getCounselTypePage = (req: Request, res: Response): void => {
  res.render("priorAuthority/counsel/counselType");
};

export const postCounselType = (req: Request, res: Response): void => {
  res.redirect("/prior-authority/counsel/justification");
};

export const getCounselJustificationPage = (
  req: Request,
  res: Response,
): void => {
  res.render("priorAuthority/justificationPage", {
    backLinkHref: "/prior-authority/counsel/type",
    formAction: "/prior-authority/counsel/justification",
    hintText:
      "Provide a background to the case that demonstrates relevant circumstances and explanation of the specific expertise required.",
  });
};

export const postCounselJustification = (
  _req: Request,
  res: Response,
): void => {
  res.redirect("/prior-authority/counsel/document-upload");
};
