import { randomUUID } from "node:crypto";

import type {
  NextFunction,
  Request,
  Response,
} from "#node_modules/@types/express/index.js";
import { submitPriorAuthority } from "#src/models/priorAuthority.models.js";
import type {
  PriorAuthority,
  UploadedDocument,
} from "#src/types/prior-authority.js";
import { logger } from "#src/utils/logger.js";
import { mapPriorAuthorityToApplicationRequest } from "#src/utils/mappers/priorAuthorityApplicationMapper.js";
import { deleteDraft } from "#src/models/drafts.models.js";

function getStoredDocs(req: Request): UploadedDocument[] {
  const priorAuthority: Partial<PriorAuthority> =
    req.session.priorAuthority ?? {};
  return priorAuthority.uploadedDocuments ?? [];
}

export const getStartPage = (req: Request, res: Response): void => {
  res.render("pa-form/start-page.njk");
};

export const getPaTypePage = (req: Request, res: Response): void => {
  res.render("pa-form/type-pa.njk");
};

export const postPriorAuthorityType = (req: Request, res: Response): void => {
  res.redirect("/pa-form/is-guideline-rate-exceeded");
};

export const getConfirmationPage = (req: Request, res: Response): void => {
  res.render("pa-form/confirmation-page");
};

export const getSearchAnExpertTypePage = (
  req: Request,
  res: Response,
): void => {
  res.render("pa-form/search-an-expert-type");
};

export const postExpertType = (req: Request, res: Response): void => {
  res.redirect("/pa-form/expert-costs");
};

export const getGuidelineRatesExceededPage = (
  req: Request,
  res: Response,
): void => {
  res.render("pa-form/is-guideline-rate-exceeded");
};

export const postGuidelineRatesExceededPage = (
  req: Request<unknown, unknown, { GuidelineRatesExceeded?: string }>,
  res: Response,
): void => {
  if (req.body.GuidelineRatesExceeded === "Yes") {
    res.redirect("/pa-form/expert-based-in-london");
  } else {
    res.redirect("/pa-form/no-prior-authority-needed");
  }
};

export const getExpertCostsPage = (req: Request, res: Response): void => {
  const priorAuthority = req.session.priorAuthority ?? {};
  res.render("pa-form/expert-costs", { priorAuthority });
};

export const postExpertCosts = (req: Request, res: Response): void => {
  res.redirect("/pa-form/document-upload");
};

export const getCheckYourAnswersPage = (req: Request, res: Response): void => {
  res.render("pa-form/check-your-answers");
};

export const postCheckYourAnswers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const priorAuthority: Partial<PriorAuthority> =
    req.session.priorAuthority ?? {};

  // TODO: source applicationId from the parent application once that flow exists.
  const applicationId = randomUUID();

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
      await deleteDraft(req.session.draftId);
      req.session.draftId = undefined;
      logger.logInfo(
        "postCheckYourAnswers",
        `Deleted draft with ID: ${req.session.draftId}`,
        req,
      );
    }

    res.redirect("/pa-form/confirmation-page");
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

export const getDocumentUploadPage = (req: Request, res: Response): void => {
  const storedDocs = getStoredDocs(req);
  const uploadedFiles = storedDocs.map((doc) => ({
    message: { text: doc.originalFileName },
    fileName: doc.fileName,
    originalFileName: doc.originalFileName,
    deleteButton: { text: "Delete" },
  }));
  res.render("pa-form/document-upload", { uploadedFiles });
};

export const postUploadedDocuments = (_req: Request, res: Response): void => {
  res.redirect("/pa-form/check-your-answers");
};

export const getNoPriorAuthorityNeededPage = (
  req: Request,
  res: Response,
): void => {
  res.render("pa-form/no-prior-authority-needed");
};

export const getExpertBasedInLondonPage = (
  req: Request,
  res: Response,
): void => {
  res.render("pa-form/expert-based-in-london");
};

export const postExpertBasedInLondonPage = (
  req: Request,
  res: Response,
): void => {
  res.redirect("/pa-form/search-an-expert-type");
};
