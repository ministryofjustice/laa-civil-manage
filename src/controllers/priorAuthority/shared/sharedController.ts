import type {
  NextFunction,
  Request,
  Response,
} from "#node_modules/@types/express/index.js";
import { DEV_APPLICATION_ID } from "#src/constants.js";
import { deleteDraft } from "#src/models/draftsModels.js";
import { submitPriorAuthority } from "#src/models/priorAuthorityModels.js";
import type {
  PriorAuthority,
  PriorAuthorityType,
  UploadedDocument,
} from "#src/types/priorAuthority/form.js";
import { buildUploadedFilesList } from "#src/utils/documentUploadHelpers.js";
import { logger } from "#src/utils/logger.js";
import { mapPriorAuthorityToApplicationRequest } from "#src/utils/mappers/priorAuthorityApplicationMapper.js";

function getStoredDocs(req: Request): UploadedDocument[] {
  const priorAuthority: Partial<PriorAuthority> =
    req.session.priorAuthority ?? {};
  return priorAuthority.uploadedDocuments ?? [];
}

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
      res.redirect("/prior-authority-form/expert");
      break;
    }
    case "Counsel": {
      res.redirect("/prior-authority-form/counsel");
      break;
    }
    case "Disbursement": {
      res.redirect("/prior-authority-form/disbursement");
      break;
    }
  }
};

export const getConfirmationPage = (req: Request, res: Response): void => {
  res.render("priorAuthorityForm/confirmationPage");
};

export const getCheckYourAnswersPage = (req: Request, res: Response): void => {
  res.render("priorAuthorityForm/checkYourAnswers");
};

export const postCheckYourAnswers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // TODO: source applicationId from the parent application once that flow exists.
  const applicationId = DEV_APPLICATION_ID;
  const priorAuthority: Partial<PriorAuthority> =
    req.session.priorAuthority ?? {};

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

    res.redirect("/prior-authority-form/confirmation-page");
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
  const uploadedFiles = buildUploadedFilesList(storedDocs);
  res.render("priorAuthorityForm/documentUpload", { uploadedFiles });
};

export const postUploadedDocuments = (_req: Request, res: Response): void => {
  res.redirect("/prior-authority-form/check-your-answers");
};

export const getNoPriorAuthorityNeededPage = (
  req: Request,
  res: Response,
): void => {
  res.render("priorAuthorityForm/noPriorAuthorityNeeded");
};
