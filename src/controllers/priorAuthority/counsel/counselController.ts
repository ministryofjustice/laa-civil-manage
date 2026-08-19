import type { NextFunction, Request, Response } from "express";
import { submitPriorAuthorityApplication } from "#src/utils/priorAuthority/submitPriorAuthorityApplication.js";

const startCounselJourney = (req: Request): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {}, disbursement: {} };

  req.session.priorAuthority = {
    ...req.session.priorAuthority,
    type: "Counsel",
    expert: {},
    disbursement: {},
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
      "Provide a background to the case that demonstrates relevant circumstances and explanation of the specific expertise required",
  });
};

export const postCounselJustification = (
  _req: Request,
  res: Response,
): void => {
  res.redirect("/prior-authority/counsel/document-upload");
};

export const getCounselCheckYourAnswersPage = (
  req: Request,
  res: Response,
): void => {
  res.render("priorAuthority/checkYourAnswers", {
    basePath: "/prior-authority/counsel",
    summaryCardsTemplate: "priorAuthority/counsel/checkYourAnswersSummary.njk",
  });
};

export const postCounselCheckYourAnswers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  await submitPriorAuthorityApplication(
    req,
    res,
    next,
    "/prior-authority/counsel/confirmation-page",
  );
};
