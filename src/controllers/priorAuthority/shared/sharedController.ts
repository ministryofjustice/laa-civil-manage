import type {
  NextFunction,
  Request,
  Response,
} from "#node_modules/@types/express/index.js";
import type {
  PriorAuthority,
  PriorAuthorityType,
} from "#src/types/priorAuthority/shared.js";
import { DEV_APPLICATION_ID } from "#src/constants.js";
import { deleteDraft } from "#src/models/draftsModels.js";
import { submitPriorAuthority } from "#src/models/priorAuthorityModels.js";
import { logger } from "#src/utils/logger.js";
import { mapPriorAuthorityToApplicationRequest } from "#src/utils/mappers/priorAuthorityApplicationMapper.js";
import {
  buildCounselSummaryCards,
  buildExpertSummaryCards,
} from "#src/utils/priorAuthority/checkYourAnswersCards.js";

export const getPriorAuthorityTypePage = (
  req: Request,
  res: Response,
): void => {
  res.render("priorAuthorityForm/typePriorAuthority.njk");
};

export const postPriorAuthorityType = (
  req: Request<unknown, unknown, { PriorAuthorityType: PriorAuthorityType }>,
  res: Response,
): void => {
  switch (req.body.PriorAuthorityType) {
    case "Expert": {
      res.redirect("/prior-authority/expert");
      break;
    }
    case "Counsel": {
      res.redirect("/prior-authority/counsel");
      break;
    }
    case "Disbursement": {
      res.redirect("/prior-authority/disbursement");
      break;
    }
  }
};

export const getConfirmationPage = (req: Request, res: Response): void => {
  res.render("priorAuthorityForm/confirmationPage");
};

export const getCheckYourAnswersPage = (req: Request, res: Response): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {} };
  const priorAuthority = req.session.priorAuthority;
  const isCounsel = priorAuthority.type === "Counsel";
  const basePath = isCounsel
    ? "/prior-authority/counsel"
    : "/prior-authority/expert";

  res.render("priorAuthorityForm/checkYourAnswers", {
    summaryCards: isCounsel
      ? buildCounselSummaryCards(priorAuthority.counsel, basePath)
      : buildExpertSummaryCards(priorAuthority.expert, basePath),
    backLinkHref: `${basePath}/document-upload`,
    formAction: `${basePath}/check-your-answers`,
  });
};

export const postCheckYourAnswers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // TODO: source applicationId from the parent application once that flow exists.
  const applicationId = DEV_APPLICATION_ID;
  req.session.priorAuthority ??= { expert: {}, counsel: {} };
  const priorAuthority: PriorAuthority = req.session.priorAuthority;
  const basePath =
    priorAuthority.type === "Counsel"
      ? "/prior-authority/counsel"
      : "/prior-authority/expert";

  try {
    const payload = mapPriorAuthorityToApplicationRequest(
      applicationId,
      priorAuthority,
    );
    const response = await submitPriorAuthority(payload);
    req.session.priorAuthority = undefined;
    logger.logInfo(
      "postCheckYourAnswers",
      `Prior authority application submitted: submissionId=${response.submissionId} status=${response.status}`,
      req,
    );

    if (req.session.draftId) {
      const deletedDraftId = req.session.draftId;
      await deleteDraft(req.session.draftId);
      req.session.draftId = undefined;
      logger.logInfo(
        "postCheckYourAnswers",
        `Deleted draft with ID: ${deletedDraftId}`,
        req,
      );
    }

    res.redirect(`${basePath}/confirmation-page`);
  } catch (error) {
    logger.logError(
      "postCheckYourAnswers",
      "Failed to submit prior authority",
      error,
      req,
    );
    next(error);
  }
};

export const getNoPriorAuthorityNeededPage = (
  req: Request,
  res: Response,
): void => {
  res.render("priorAuthorityForm/noPriorAuthorityNeeded");
};
