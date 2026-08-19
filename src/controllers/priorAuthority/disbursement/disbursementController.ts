import { getApplicationFromSession } from "#src/middleware/priorAuthority/shared/applicationSession.js";
import { submitPriorAuthorityApplication } from "#src/utils/priorAuthority/submitPriorAuthorityApplication.js";
import type { NextFunction, Request, Response } from "express";

const startDisbursementJourney = (req: Request): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {}, disbursement: {} };

  req.session.priorAuthority = {
    ...req.session.priorAuthority,
    type: "Disbursement",
    expert: {},
    counsel: {},
  };
};

export const getDisbursementLandingPage = (
  req: Request,
  res: Response,
): void => {
  const application = getApplicationFromSession(req);

  if (!application) {
    res.redirect("/applications");
    return;
  }
  startDisbursementJourney(req);

  res.render("priorAuthority/disbursement/disbursementLandingPage", {
    applicationId: application.applicationId,
  });
};

export const getDisbursementDetailsPage = (
  req: Request,
  res: Response,
): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {}, disbursement: {} };
  const priorAuthority = req.session.priorAuthority.disbursement;
  res.render("priorAuthority/disbursement/disbursementDetail", {
    priorAuthority,
  });
};

export const postDisbursementDetailsPage = (
  req: Request,
  res: Response,
): void => {
  res.redirect("/prior-authority/disbursement/justification");
};

export const getDisbursementJustificationPage = (
  req: Request,
  res: Response,
): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {}, disbursement: {} };
  const priorAuthority = req.session.priorAuthority.disbursement;
  res.render("priorAuthority/justificationPage", {
    priorAuthority,
    backLinkHref: "/prior-authority/disbursement/details",
    formAction: "/prior-authority/disbursement/justification",
    hintText: "Explain why this request is necessary",
    heading: "Why is this disbursement required?",
  });
};

export const postDisbursementJustificationPage = (
  req: Request,
  res: Response,
): void => {
  res.redirect("/prior-authority/disbursement/document-upload");
};

export const getDisbursementCheckYourAnswersPage = (
  req: Request,
  res: Response,
): void => {
  res.render("priorAuthority/checkYourAnswers", {
    basePath: "/prior-authority/disbursement",
    summaryCardsTemplate:
      "priorAuthority/disbursement/checkYourAnswersSummary.njk",
    justificationTitle: "Why is this disbursement required?",
  });
};

export const postDisbursementCheckYourAnswers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  await submitPriorAuthorityApplication(
    req,
    res,
    next,
    "/prior-authority/disbursement/confirmation-page",
  );
};
