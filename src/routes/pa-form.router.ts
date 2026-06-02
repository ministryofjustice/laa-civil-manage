import express from "express";

import {
  getCheckYourAnswersPage,
  getConfirmationPage,
  getExpertCostsPage,
  getNoPriorAuthorityNeededPage,
  getPaTypePage,
  getExpertDetailsPage,
  getStartPage,
  postCheckYourAnswers,
  postExpertDetails,
  postExpertCosts,
  postGuidelineRatesExceededPage,
  postPriorAuthorityType,
  getGuidelineRatesExceededPage,
  getExpertBasedInLondonPage,
  postExpertBasedInLondonPage,
} from "#src/controllers/pa-form.controller.js";
import {
  expertCostsSchema,
  guidelineRatesExceededSchema,
  typeOfPriorAuthoritySchema,
  expertDetailsSchema,
  expertBasedInLondonSchema,
} from "#src/validation/prior-authority.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import { saveToSession } from "#src/middleware/saveToSession.js";
import { saveExpertCostsToSession } from "#src/middleware/saveExpertCostsToSession.js";
import type {
  PriorAuthorityExpertBasedInLondon,
  PriorAuthorityExpertFullName,
  PriorAuthorityExpertType,
  PriorAuthorityIsGuidelineRateExceeded,
  PriorAuthorityType,
} from "#src/types/prior-authority.js";
import { loadExpertTypesMiddleware } from "#src/middleware/loadExpertTypes.js";
import { saveToSessionFromDrafts } from "#src/middleware/saveToSessionFromDrafts.js";
import { saveToDrafts } from "#src/middleware/saveToDrafts.js";
import { calculateCosts } from "#src/middleware/calculateCosts.js";

const paFormRouter = express.Router();

paFormRouter.get("/start-page", saveToSessionFromDrafts, getStartPage);

paFormRouter.get("/type-pa", getPaTypePage);

paFormRouter.post(
  "/type-pa",
  saveToSession<{ PriorAuthorityType: PriorAuthorityType }, "type">(
    "type",
    (body) => body.PriorAuthorityType,
  ),
  saveToDrafts,
  validateData(typeOfPriorAuthoritySchema, "pa-form/type-pa"),
  postPriorAuthorityType,
);

paFormRouter.get("/expert-costs", getExpertCostsPage);

paFormRouter.post(
  "/expert-costs",
  calculateCosts,
  saveExpertCostsToSession,
  saveToDrafts,
  validateData(expertCostsSchema, "pa-form/expert-costs"),
  postExpertCosts,
);

paFormRouter.get("/check-your-answers", getCheckYourAnswersPage);

paFormRouter.post("/check-your-answers", saveToDrafts, postCheckYourAnswers);

paFormRouter.get("/confirmation-page", getConfirmationPage);

paFormRouter.get("/no-prior-authority-needed", getNoPriorAuthorityNeededPage);

paFormRouter.use("/expert-details", loadExpertTypesMiddleware);

paFormRouter.get("/expert-details", getExpertDetailsPage);

paFormRouter.post(
  "/expert-details",
  saveToSession<
    {
      PriorAuthorityExpertType: PriorAuthorityExpertType;
      PriorAuthorityExpertFullName: PriorAuthorityExpertFullName;
    },
    "expertType"
  >("expertType", (body) => body.PriorAuthorityExpertType),
  saveToSession<
    {
      PriorAuthorityExpertType: PriorAuthorityExpertType;
      PriorAuthorityExpertFullName: PriorAuthorityExpertFullName;
    },
    "fullName"
  >("fullName", (body) => body.PriorAuthorityExpertFullName),
  saveToDrafts,
  validateData(expertDetailsSchema, "pa-form/expert-details"),
  postExpertDetails,
);

paFormRouter.get("/is-guideline-rate-exceeded", getGuidelineRatesExceededPage);

paFormRouter.post(
  "/is-guideline-rate-exceeded",
  saveToSession<
    { GuidelineRatesExceeded: PriorAuthorityIsGuidelineRateExceeded },
    "guidelineRatesExceeded"
  >("guidelineRatesExceeded", (body) => body.GuidelineRatesExceeded),
  saveToDrafts,
  validateData(
    guidelineRatesExceededSchema,
    "pa-form/is-guideline-rate-exceeded.njk",
  ),
  postGuidelineRatesExceededPage,
);

paFormRouter.get("/no-prior-authority-needed", getNoPriorAuthorityNeededPage);

paFormRouter.get("/expert-based-in-london", getExpertBasedInLondonPage);

paFormRouter.post(
  "/expert-based-in-london",
  saveToSession<
    { expertBasedInLondon: PriorAuthorityExpertBasedInLondon },
    "expertBasedInLondon"
  >("expertBasedInLondon", (body) => body.expertBasedInLondon),
  saveToDrafts,
  validateData(expertBasedInLondonSchema, "pa-form/expert-based-in-london.njk"),
  postExpertBasedInLondonPage,
);

export default paFormRouter;
