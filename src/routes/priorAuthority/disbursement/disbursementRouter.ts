import {
  getDisbursementCheckYourAnswersPage,
  getDisbursementDetailsPage,
  getDisbursementJustificationPage,
  getDisbursementLandingPage,
  postDisbursementCheckYourAnswers,
  postDisbursementDetailsPage,
  postDisbursementJustificationPage,
} from "#src/controllers/priorAuthority/disbursement/disbursementController.js";
import { getConfirmationPage as getSharedConfirmationPage } from "#src/controllers/priorAuthority/shared/sharedController.js";
import { saveDisbursement } from "#src/middleware/priorAuthority/shared/saveToSession.js";
import { saveToDrafts } from "#src/middleware/priorAuthority/shared/saveToDrafts.js";
import { createDocumentUploadRouter } from "#src/routes/documentUploadRouter.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import {
  disbursementDetailsSchema,
  disbursementJustificationSchema,
} from "#src/validation/priorAuthority/disbursement/disbursementValidation.js";
import express from "express";

const disbursementRouter = express.Router();

interface DisbursementDetailsBody {
  PriorAuthorityDisbursementPurpose: string;
  PriorAuthorityDisbursementAmount: string;
}

disbursementRouter.get("/", getDisbursementLandingPage);

disbursementRouter.get("/details", getDisbursementDetailsPage);

disbursementRouter.post(
  "/details",
  saveDisbursement(
    "disbursementPurpose",
    (body: DisbursementDetailsBody) => body.PriorAuthorityDisbursementPurpose,
  ),
  saveDisbursement(
    "disbursementAmount",
    (body: DisbursementDetailsBody) => body.PriorAuthorityDisbursementAmount,
  ),
  saveToDrafts,
  validateData(
    disbursementDetailsSchema,
    "priorAuthority/disbursement/disbursementDetail",
  ),
  postDisbursementDetailsPage,
);

disbursementRouter.get("/justification", getDisbursementJustificationPage);

disbursementRouter.post(
  "/justification",
  (req, res, next) => {
    res.locals.backLinkHref = "/prior-authority/disbursement/details";
    res.locals.formAction = "/prior-authority/disbursement/justification";
    res.locals.hintText = "Explain why this request is necessary";
    res.locals.heading = "Why is this disbursement required?";
    next();
  },
  saveDisbursement(
    "justification",
    (body: { justification: string }) => body.justification,
  ),
  saveToDrafts,
  validateData(
    disbursementJustificationSchema,
    "priorAuthority/justificationPage",
  ),
  postDisbursementJustificationPage,
);

disbursementRouter.get(
  "/check-your-answers",
  getDisbursementCheckYourAnswersPage,
);

disbursementRouter.post(
  "/check-your-answers",
  saveToDrafts,
  postDisbursementCheckYourAnswers,
);

disbursementRouter.use(
  createDocumentUploadRouter({
    section: "disbursement",
    basePath: "/prior-authority/disbursement",
    backLinkHref: "/prior-authority/disbursement/justification",
    continueRedirect: "/prior-authority/disbursement/check-your-answers",
    introTemplate: "priorAuthority/disbursement/documentUploadIntro.njk",
    pdfOnly: true,
  }),
);

disbursementRouter.get("/confirmation-page", getSharedConfirmationPage);

export default disbursementRouter;
