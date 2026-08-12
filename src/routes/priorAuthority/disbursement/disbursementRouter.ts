import {
  getDisbursementDetailsPage,
  getDisbursementLandingPage,
  postDisbursementDetailsPage,
} from "#src/controllers/priorAuthority/disbursement/disbursementController.js";
import { saveDisbursement } from "#src/middleware/priorAuthority/shared/saveToSession.js";
import { saveToDrafts } from "#src/middleware/priorAuthority/shared/saveToDrafts.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import { disbursementDetailsSchema } from "#src/validation/priorAuthority/disbursement/disbursementValidation.js";
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

export default disbursementRouter;
