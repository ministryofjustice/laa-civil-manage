import express from "express";

import {
  getExpertBasedInLondonPage,
  getExpertCostsPage,
  getExpertDetailsPage,
  getExpertLandingPage,
  getGuidelineRatesExceededPage,
  getJustificationPage,
  postExpertBasedInLondonPage,
  postExpertCosts,
  postExpertDetails,
  postGuidelineRatesExceededPage,
  postJustificationPage,
} from "#src/controllers/priorAuthority/expert/expertController.js";
import { calculateCosts } from "#src/middleware/priorAuthority/expert/calculateCosts.js";
import { loadExpertTypesMiddleware } from "#src/middleware/priorAuthority/expert/loadExpertTypes.js";
import { saveToDrafts } from "#src/middleware/priorAuthority/shared/saveToDrafts.js";
import { saveExpertCostsToSession } from "#src/middleware/priorAuthority/expert/saveExpertCostsToSession.js";
import { saveExpert } from "#src/middleware/priorAuthority/shared/saveToSession.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import type {
  PriorAuthorityExpertBasedInLondon,
  PriorAuthorityExpertFullName,
  PriorAuthorityExpertType,
  PriorAuthorityIsGuidelineRateExceeded,
} from "#src/types/priorAuthority/expert.js";
import {
  expertBasedInLondonSchema,
  expertCostsSchema,
  expertDetailsSchema,
  guidelineRatesExceededSchema,
  justificationSchema,
} from "#src/validation/priorAuthority/expert/expertValidation.js";

const expertRouter = express.Router();

interface ExpertDetailsBody {
  PriorAuthorityExpertType: PriorAuthorityExpertType;
  PriorAuthorityExpertTypeOther?: PriorAuthorityExpertType;
  PriorAuthorityExpertFullName: PriorAuthorityExpertFullName;
}

expertRouter.get("/expert-costs", getExpertCostsPage);

expertRouter.post(
  "/expert-costs",
  calculateCosts,
  saveExpertCostsToSession,
  saveToDrafts,
  validateData(expertCostsSchema, "priorAuthorityForm/expert/expertCosts"),
  postExpertCosts,
);

expertRouter.use("/expert-details", loadExpertTypesMiddleware);

expertRouter.get("/expert-details", getExpertDetailsPage);

expertRouter.post(
  "/expert-details",
  saveExpert("expertType", (body: ExpertDetailsBody) =>
    body.PriorAuthorityExpertType === "Other"
      ? body.PriorAuthorityExpertTypeOther
      : body.PriorAuthorityExpertType,
  ),
  saveExpert(
    "fullName",
    (body: ExpertDetailsBody) => body.PriorAuthorityExpertFullName,
  ),
  saveToDrafts,
  validateData(expertDetailsSchema, "priorAuthorityForm/expert/expertDetails"),
  postExpertDetails,
);

expertRouter.get("/is-guideline-rate-exceeded", getGuidelineRatesExceededPage);

expertRouter.post(
  "/is-guideline-rate-exceeded",
  saveExpert(
    "guidelineRatesExceeded",
    (body: { GuidelineRatesExceeded: PriorAuthorityIsGuidelineRateExceeded }) =>
      body.GuidelineRatesExceeded,
  ),
  saveToDrafts,
  validateData(
    guidelineRatesExceededSchema,
    "priorAuthorityForm/expert/isGuidelineRateExceeded.njk",
  ),
  postGuidelineRatesExceededPage,
);

expertRouter.get("/expert-based-in-london", getExpertBasedInLondonPage);

expertRouter.post(
  "/expert-based-in-london",
  saveExpert(
    "expertBasedInLondon",
    (body: { expertBasedInLondon: PriorAuthorityExpertBasedInLondon }) =>
      body.expertBasedInLondon,
  ),
  saveToDrafts,
  validateData(
    expertBasedInLondonSchema,
    "priorAuthorityForm/expert/expertBasedInLondon.njk",
  ),
  postExpertBasedInLondonPage,
);

expertRouter.get("/justification", getJustificationPage);

expertRouter.post(
  "/justification",
  saveExpert(
    "justification",
    (body: { justification: string }) => body.justification,
  ),
  saveToDrafts,
  validateData(justificationSchema, "priorAuthorityForm/justificationPage"),
  postJustificationPage,
);

expertRouter.get("/expert", getExpertLandingPage);

export default expertRouter;
