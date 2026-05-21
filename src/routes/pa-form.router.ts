import express from "express";

import {
  getCheckYourAnswersPage,
  getConfirmationPage,
  getExpertCostsPage,
  getNoPriorAuthorityNeededPage,
  getPaTypePage,
  getSearchAnExpertTypePage,
  getStartPage,
  postCheckYourAnswers,
  postExpertType,
  postExpertCosts,
  postGuidelineRatesExceededPage,
  postPriorAuthorityType,
  getGuidelineRatesExceededPage,
} from "#src/controllers/pa-form.controller.js";
import {
  expertCostsSchema,
  guidelineRatesExceededSchema,
  typeOfPriorAuthoritySchema,
  typeOfExpertSchema,
} from "#src/validation/prior-authority.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import { saveToSession } from "#src/middleware/saveToSession.js";
import { saveExpertCostsToSession } from "#src/middleware/saveExpertCostsToSession.js";
import type {
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

paFormRouter.use("/pa-form/search-an-expert-type", loadExpertTypesMiddleware);

paFormRouter.get("/pa-form/search-an-expert-type", getSearchAnExpertTypePage);

paFormRouter.post(
  "/pa-form/search-an-expert-type",
  validateData(typeOfExpertSchema, "pa-form/search-an-expert-type"),
  saveToSession<
    { PriorAuthorityExpertType: PriorAuthorityExpertType },
    "expertType"
  >("expertType", (body) => body.PriorAuthorityExpertType),
  postExpertType,
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

export default paFormRouter;
