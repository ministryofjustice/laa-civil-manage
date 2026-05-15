import type { Request, Response } from "#node_modules/@types/express/index.js";
import type {
  PriorAuthority,
  UploadedDocument,
} from "#src/types/prior-authority.js";

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
  res.redirect("/pa-form/expert-details");
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
    res.redirect("/pa-form/search-an-expert-type");
  } else {
    res.redirect("/pa-form/no-prior-authority-needed");
  }
};

export const getExpertDetailsPage = (req: Request, res: Response): void => {
  res.render("pa-form/expert-details");
};

export const postExpertDetails = (req: Request, res: Response): void => {
  res.redirect("/pa-form/check-your-answers");
};

export const getCheckYourAnswersPage = (req: Request, res: Response): void => {
  res.render("pa-form/check-your-answers");
};

export const postCheckYourAnswers = (req: Request, res: Response): void => {
  res.redirect("/pa-form/confirmation-page");
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
  res.redirect("/pa-form/confirmation-page");
};

export const getNoPriorAuthorityNeededPage = (
  req: Request,
  res: Response,
): void => {
  res.render("pa-form/no-prior-authority-needed");
};
