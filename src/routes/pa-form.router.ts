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

const paFormRouter = express.Router();

// TODO This can be removed once the app has a landing page
paFormRouter.get("/", getStartPage);

paFormRouter.get("/pa-form/start-page", getStartPage);

paFormRouter.get("/pa-form/type-pa", getPaTypePage);

paFormRouter.post(
  "/pa-form/type-pa",
  validateData(typeOfPriorAuthoritySchema, "pa-form/type-pa"),
  saveToSession<{ PriorAuthorityType: PriorAuthorityType }, "type">(
    "type",
    (body) => body.PriorAuthorityType,
  ),
  postPriorAuthorityType,
);

paFormRouter.get("/pa-form/expert-costs", getExpertCostsPage);

paFormRouter.post(
  "/pa-form/expert-costs",
  validateData(expertCostsSchema, "pa-form/expert-costs"),
  saveExpertCostsToSession,
  postExpertCosts,
);

paFormRouter.get("/pa-form/check-your-answers", getCheckYourAnswersPage);

paFormRouter.post("/pa-form/check-your-answers", postCheckYourAnswers);

paFormRouter.get("/pa-form/confirmation-page", getConfirmationPage);

paFormRouter.get(
  "/pa-form/no-prior-authority-needed",
  getNoPriorAuthorityNeededPage,
);

paFormRouter.use("/pa-form/expert-details", loadExpertTypesMiddleware);

paFormRouter.get("/pa-form/expert-details", getExpertDetailsPage);

paFormRouter.post(
  "/pa-form/expert-details",
  validateData(expertDetailsSchema, "pa-form/expert-details"),
  saveToSession<
    { PriorAuthorityExpertType: PriorAuthorityExpertType },
    "expertType"
  >("expertType", (body) => body.PriorAuthorityExpertType),
  saveToSession<
    {
      PriorAuthorityExpertType: PriorAuthorityExpertType;
      PriorAuthorityExpertFullName: PriorAuthorityExpertFullName;
    },
    "fullName"
  >("fullName", (body) => body.PriorAuthorityExpertFullName),
  postExpertDetails,
);

paFormRouter.get(
  "/pa-form/is-guideline-rate-exceeded",
  getGuidelineRatesExceededPage,
);

paFormRouter.post(
  "/pa-form/is-guideline-rate-exceeded",
  validateData(
    guidelineRatesExceededSchema,
    "pa-form/is-guideline-rate-exceeded.njk",
  ),
  saveToSession<
    { GuidelineRatesExceeded: PriorAuthorityIsGuidelineRateExceeded },
    "guidelineRatesExceeded"
  >("guidelineRatesExceeded", (body) => body.GuidelineRatesExceeded),
  postGuidelineRatesExceededPage,
);

paFormRouter.get(
  "/pa-form/no-prior-authority-needed",
  getNoPriorAuthorityNeededPage,
);

paFormRouter.get("/pa-form/expert-based-in-london", getExpertBasedInLondonPage);

paFormRouter.post(
  "/pa-form/expert-based-in-london",
  validateData(expertBasedInLondonSchema, "pa-form/expert-based-in-london.njk"),
  saveToSession<
    { expertBasedInLondon: PriorAuthorityExpertBasedInLondon },
    "expertBasedInLondon"
  >("expertBasedInLondon", (body) => body.expertBasedInLondon),
  postExpertBasedInLondonPage,
);

export default paFormRouter;
