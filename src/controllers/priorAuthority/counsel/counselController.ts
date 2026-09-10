import type { NextFunction, Request, Response } from "express";
import { DEV_APPLICATION_ID } from "#src/constants.js";
import { getApplicationFromSession } from "#src/middleware/priorAuthority/shared/applicationSession.js";
import { createPriorAuthorityDraft } from "#src/models/priorAuthorityModels.js";
import { submitPriorAuthorityApplication } from "#src/utils/priorAuthority/submitPriorAuthorityApplication.js";

export const getCounselLandingPage = (req: Request, res: Response): void => {
  const application = getApplicationFromSession(req);

  if (!application) {
    res.redirect("/applications");
    return;
  }

  res.render("priorAuthority/counsel/counselLandingPage", {
    applicationId: application.applicationId,
  });
};

export const postStartCounselJourney = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const applicationId =
    getApplicationFromSession(req)?.applicationId ?? DEV_APPLICATION_ID;

  try {
    const { priorAuthorityId } = await createPriorAuthorityDraft({
      applicationId,
      priorAuthorityType: "COUNSEL",
    });
    req.session.priorAuthorityId = priorAuthorityId;
    res.redirect("/prior-authority/counsel/type");
  } catch (error) {
    next(error);
  }
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
    heading: "Why is this application necessary?",
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
