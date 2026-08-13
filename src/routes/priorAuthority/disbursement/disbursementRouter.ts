import {
  getDisbursementDetailsPage,
  getDisbursementJustificationPage,
  getDisbursementLandingPage,
  postDisbursementDetailsPage,
  postDisbursementJustificationPage,
} from "#src/controllers/priorAuthority/disbursement/disbursementController.js";
import { saveDisbursement } from "#src/middleware/priorAuthority/shared/saveToSession.js";
import { saveToDrafts } from "#src/middleware/priorAuthority/shared/saveToDrafts.js";
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
    res.locals.hintText = "Explain why this request is necessary.";
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

export default disbursementRouter;
