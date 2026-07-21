import type { Request, Response } from "#node_modules/@types/express/index.js";
import type { ExpertTypeOption } from "#src/types/csrfTypes.js";

const clearCounselJourneySessionData = (req: Request): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {} };

  req.session.priorAuthority = {
    ...req.session.priorAuthority,
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

  res.render("priorAuthorityForm/expert/expertDetails", {
    priorAuthority,
    fallbackSelectedExpertType: selectedExpertType,
    fallbackOtherExpertType: otherExpertType,
  });
};

export const postExpertDetails = (req: Request, res: Response): void => {
  res.redirect("/prior-authority-form/expert-costs");
};

export const getGuidelineRatesExceededPage = (
  req: Request,
  res: Response,
): void => {
  res.render("priorAuthorityForm/expert/isGuidelineRateExceeded");
};

export const postGuidelineRatesExceededPage = (
  req: Request<unknown, unknown, { GuidelineRatesExceeded?: string }>,
  res: Response,
): void => {
  if (req.body.GuidelineRatesExceeded === "Yes") {
    res.redirect("/prior-authority-form/expert-based-in-london");
  } else {
    res.redirect("/prior-authority-form/no-prior-authority-needed");
  }
};

export const getExpertCostsPage = (req: Request, res: Response): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {} };
  const priorAuthority = req.session.priorAuthority.expert;
  res.render("priorAuthorityForm/expert/expertCosts", { priorAuthority });
};

export const postExpertCosts = (req: Request, res: Response): void => {
  res.redirect("/prior-authority-form/justification");
};

export const getExpertBasedInLondonPage = (
  req: Request,
  res: Response,
): void => {
  res.render("priorAuthorityForm/expert/expertBasedInLondon");
};

export const postExpertBasedInLondonPage = (
  req: Request,
  res: Response,
): void => {
  res.redirect("/prior-authority-form/expert-details");
};

export const getJustificationPage = (req: Request, res: Response): void => {
  res.render("priorAuthorityForm/justificationPage");
};

export const postJustificationPage = (req: Request, res: Response): void => {
  res.redirect("/prior-authority-form/document-upload");
};

export const getExpertLandingPage = (req: Request, res: Response): void => {
  clearCounselJourneySessionData(req);
  res.render("priorAuthorityForm/expert/expertLandingPage");
};
