import type {
  NextFunction,
  Request,
  Response,
} from "#node_modules/@types/express/index.js";
import type { ExpertTypeOption } from "#src/types/csrfTypes.js";
import { submitPriorAuthorityApplication } from "#src/utils/priorAuthority/submitPriorAuthorityApplication.js";

const startExpertJourney = (req: Request): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {} };

  req.session.priorAuthority = {
    ...req.session.priorAuthority,
    type: "Expert",
    counsel: {},
  };
};

export const getExpertDetailsPage = (req: Request, res: Response): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {} };
  const priorAuthority = req.session.priorAuthority.expert;
  const expertTypes: ExpertTypeOption[] = res.locals.expertTypes ?? [];
  const currentExpertType = priorAuthority.expertType?.trim();
  const selectedExpertType = currentExpertType
    ? expertTypes.some((expertType) => expertType.value === currentExpertType)
      ? currentExpertType
      : "Other"
    : undefined;
  const otherExpertType =
    currentExpertType && selectedExpertType === "Other"
      ? currentExpertType
      : undefined;

  res.render("priorAuthority/expert/expertDetails", {
    priorAuthority,
    fallbackSelectedExpertType: selectedExpertType,
    fallbackOtherExpertType: otherExpertType,
  });
};

export const postExpertDetails = (req: Request, res: Response): void => {
  res.redirect("/prior-authority/expert/costs");
};

export const getGuidelineRatesExceededPage = (
  req: Request,
  res: Response,
): void => {
  res.render("priorAuthority/expert/isGuidelineRateExceeded");
};

export const postGuidelineRatesExceededPage = (
  req: Request<unknown, unknown, { GuidelineRatesExceeded?: string }>,
  res: Response,
): void => {
  if (req.body.GuidelineRatesExceeded === "Yes") {
    res.redirect("/prior-authority/expert/based-in-london");
  } else {
    res.redirect("/prior-authority/expert/no-prior-authority-needed");
  }
};

export const getExpertCostsPage = (req: Request, res: Response): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {} };
  const priorAuthority = req.session.priorAuthority.expert;
  res.render("priorAuthority/expert/expertCosts", { priorAuthority });
};

export const postExpertCosts = (req: Request, res: Response): void => {
  res.redirect("/prior-authority/expert/justification");
};

export const getExpertBasedInLondonPage = (
  req: Request,
  res: Response,
): void => {
  res.render("priorAuthority/expert/expertBasedInLondon");
};

export const postExpertBasedInLondonPage = (
  req: Request,
  res: Response,
): void => {
  res.redirect("/prior-authority/expert/details");
};

export const getCostsSharedPage = (req: Request, res: Response): void => {
  res.render("priorAuthority/expert/costs-shared");
};

export const postCostsSharedPage = (
  req: Request<unknown, unknown, { CostsShared?: string }>,
  res: Response,
): void => {
  if (req.body.CostsShared === "Yes") {
    // TODO - update in CM-443
    // res.redirect("/prior-authority/expert/based-in-london");
  } else {
    res.redirect("/prior-authority/expert/justification");
  }
};

export const getJustificationPage = (req: Request, res: Response): void => {
  res.render("priorAuthority/justificationPage", {
    backLinkHref: "/prior-authority/expert/costs",
    formAction: "/prior-authority/expert/justification",
    hintText:
      "Provide a background to the case that demonstrates the relevant circumstances and explanation of the specific expertise or disbursement required.",
  });
};

export const postJustificationPage = (req: Request, res: Response): void => {
  res.redirect("/prior-authority/expert/document-upload");
};

export const getExpertLandingPage = (req: Request, res: Response): void => {
  startExpertJourney(req);
  res.render("priorAuthority/expert/expertLandingPage");
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
