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
  res.redirect("/pa-form/search-an-expert-type");
};

export const getConfirmationPage = (req: Request, res: Response): void => {
  res.render("pa-form/confirmation-page");
};

export const getSearchAnExpertTypePage = (
  req: Request,
  res: Response,
): void => {
  res.render("pa-form/search-an-expert-type.njk");
};

export const postExpertType = (req: Request, res: Response): void => {
  res.redirect("/pa-form/expert-details");
};

export const getExpertDetailsPage = (req: Request, res: Response): void => {
  res.render("pa-form/expert-details");
};

export const postExpertDetails = (req: Request, res: Response): void => {
  res.redirect("/pa-form/document-upload");
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
