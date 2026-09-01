import type {
  NextFunction,
  Request,
  Response,
} from "#node_modules/@types/express/index.js";
import { getApplicationFromSession } from "#src/middleware/priorAuthority/shared/applicationSession.js";
import { justificationBackLink } from "#src/utils/priorAuthority/expert/justificationBackLink.js";
import { submitPriorAuthorityApplication } from "#src/utils/priorAuthority/submitPriorAuthorityApplication.js";

const startExpertJourney = (req: Request): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {}, disbursement: {} };

  req.session.priorAuthority = {
    ...req.session.priorAuthority,
    type: "Expert",
    counsel: {},
    disbursement: {},
  };
};

const allowedExpertTypeValues = (res: Response): string[] =>
  (res.locals.expertTypes ?? [])
    .map((expertType) => expertType.value)
    .filter((value) => value !== "" && value !== "Other");

export const getExpertTypePage = (req: Request, res: Response): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {}, disbursement: {} };
  const priorAuthority = req.session.priorAuthority.expert;
  const allowedExpertTypes = allowedExpertTypeValues(res);
  const currentExpertType = priorAuthority.expertType?.trim();
  const selectedExpertType = currentExpertType
    ? allowedExpertTypes.includes(currentExpertType)
      ? currentExpertType
      : "Other"
    : undefined;

  res.render("priorAuthority/expert/expertType", {
    priorAuthority,
    fallbackSelectedExpertType: selectedExpertType,
  });
};

export const saveExpertTypeSelection = (
  req: Request<unknown, unknown, { PriorAuthorityExpertType?: string }>,
  res: Response,
  next: NextFunction,
): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {}, disbursement: {} };
  const expert = req.session.priorAuthority.expert;
  const allowedExpertTypes = allowedExpertTypeValues(res);
  const selection = req.body.PriorAuthorityExpertType;

  if (selection === "Other") {
    if (expert.expertType && allowedExpertTypes.includes(expert.expertType)) {
      expert.expertType = undefined;
    }
  } else if (selection && allowedExpertTypes.includes(selection)) {
    expert.expertType = selection;
  }

  next();
};

export const postExpertType = (
  req: Request<unknown, unknown, { PriorAuthorityExpertType?: string }>,
  res: Response,
): void => {
  if (req.body.PriorAuthorityExpertType === "Other") {
    res.redirect("/prior-authority/expert/other-expert-type");
  } else {
    res.redirect("/prior-authority/expert/provider-name");
  }
};

export const getOtherExpertTypePage = (req: Request, res: Response): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {}, disbursement: {} };
  const priorAuthority = req.session.priorAuthority.expert;
  const allowedExpertTypes = allowedExpertTypeValues(res);
  const currentExpertType = priorAuthority.expertType?.trim();

  if (currentExpertType && allowedExpertTypes.includes(currentExpertType)) {
    res.redirect("/prior-authority/expert/provider-name");
    return;
  }

  const otherExpertType =
    currentExpertType && !allowedExpertTypes.includes(currentExpertType)
      ? currentExpertType
      : undefined;

  res.render("priorAuthority/expert/otherExpertType", {
    priorAuthority,
    fallbackOtherExpertType: otherExpertType,
  });
};

export const postOtherExpertType = (req: Request, res: Response): void => {
  res.redirect("/prior-authority/expert/provider-name");
};

export const getProviderNamePage = (req: Request, res: Response): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {}, disbursement: {} };
  const priorAuthority = req.session.priorAuthority.expert;
  const allowedExpertTypes = allowedExpertTypeValues(res);
  const currentExpertType = priorAuthority.expertType?.trim();
  const backLinkHref =
    currentExpertType && !allowedExpertTypes.includes(currentExpertType)
      ? "/prior-authority/expert/other-expert-type"
      : "/prior-authority/expert/expert-type";

  res.render("priorAuthority/expert/providerName", {
    priorAuthority,
    backLinkHref,
  });
};

export const postProviderName = (req: Request, res: Response): void => {
  res.redirect("/prior-authority/expert/postcode");
};

export const getExpertCostsPage = (req: Request, res: Response): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {}, disbursement: {} };
  const priorAuthority = req.session.priorAuthority.expert;
  res.render("priorAuthority/expert/expertCosts", {
    priorAuthority,
    basePath: "/prior-authority/expert",
  });
};

export const postExpertCosts = (req: Request, res: Response): void => {
  res.redirect("/prior-authority/expert/costs-shared");
};

export const getApportionedDetailsPage = (
  req: Request,
  res: Response,
): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {}, disbursement: {} };
  const priorAuthority = req.session.priorAuthority.expert;
  res.render("priorAuthority/expert/apportionedDetails", { priorAuthority });
};

export const postApportionedDetails = (req: Request, res: Response): void => {
  res.redirect("/prior-authority/expert/justification");
};

export const getExpertPostcodePage = (req: Request, res: Response): void => {
  res.render("priorAuthority/expert/expertPostcode", {
    priorAuthority: req.session.priorAuthority?.expert,
  });
};

export const postExpertPostcodePage = (req: Request, res: Response): void => {
  res.redirect("/prior-authority/expert/costs");
};

export const getCostsSharedPage = (req: Request, res: Response): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {}, disbursement: {} };
  const priorAuthority = req.session.priorAuthority.expert;
  res.render("priorAuthority/expert/costsSharedWithOtherParties", {
    priorAuthority,
  });
};

export const postCostsSharedPage = (
  req: Request<unknown, unknown, { CostsShared?: string }>,
  res: Response,
): void => {
  if (req.body.CostsShared === "Yes") {
    // TODO - update in CM-443
    res.redirect("/prior-authority/expert/share-of-costs");
  } else {
    res.redirect("/prior-authority/expert/justification");
  }
};

export const getJustificationPage = (req: Request, res: Response): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {}, disbursement: {} };
  const expert = req.session.priorAuthority.expert;
  res.render("priorAuthority/justificationPage", {
    backLinkHref: justificationBackLink(expert),
    formAction: "/prior-authority/expert/justification",
    hintText:
      "Provide a background to the case that demonstrates the relevant circumstances and explanation of the specific service required",
  });
};

export const postJustificationPage = (req: Request, res: Response): void => {
  res.redirect("/prior-authority/expert/document-upload");
};

export const getExpertLandingPage = (req: Request, res: Response): void => {
  startExpertJourney(req);

  const application = getApplicationFromSession(req);

  if (!application) {
    res.redirect("/applications");
    return;
  }

  res.render("priorAuthority/expert/expertLandingPage", {
    applicationId: application.applicationId,
  });
};

export const getExpertCheckYourAnswersPage = (
  req: Request,
  res: Response,
): void => {
  res.render("priorAuthority/checkYourAnswers", {
    basePath: "/prior-authority/expert",
    summaryCardsTemplate: "priorAuthority/expert/checkYourAnswersSummary.njk",
  });
};

export const postExpertCheckYourAnswers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  await submitPriorAuthorityApplication(
    req,
    res,
    next,
    "/prior-authority/expert/confirmation-page",
  );
};
