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
  getExpertBasedInLondonPage,
  postExpertBasedInLondonPage,
} from "#src/controllers/pa-form.controller.js";
import {
  expertCostsSchema,
  guidelineRatesExceededSchema,
  typeOfPriorAuthoritySchema,
  typeOfExpertSchema,
  expertBasedInLondonSchema,
} from "#src/validation/prior-authority.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import { saveToSession } from "#src/middleware/saveToSession.js";
import { saveExpertCostsToSession } from "#src/middleware/saveExpertCostsToSession.js";
import type {
  PriorAuthorityExpertBasedInLondon,
  PriorAuthorityExpertType,
  PriorAuthorityIsGuidelineRateExceeded,
  PriorAuthorityType,
} from "#src/types/prior-authority.js";
import { loadExpertTypesMiddleware } from "#src/middleware/loadExpertTypes.js";
import { saveToSessionFromDrafts } from "#src/middleware/saveToSessionFromDrafts.js";
import { saveToDrafts } from "#src/middleware/saveToDrafts.js";

const paFormRouter = express.Router();

paFormRouter.get("/start-page", saveToSessionFromDrafts, getStartPage);

paFormRouter.get("/type-pa", getPaTypePage);

paFormRouter.post(
  "/type-pa",
  saveToDrafts,
  validateData(typeOfPriorAuthoritySchema, "pa-form/type-pa"),
  saveToSession<{ PriorAuthorityType: PriorAuthorityType }, "type">(
    "type",
    (body) => body.PriorAuthorityType,
  ),
  postPriorAuthorityType,
);

paFormRouter.get("/expert-costs", getExpertCostsPage);

paFormRouter.post(
  "/expert-costs",
  saveToDrafts,
  validateData(expertCostsSchema, "pa-form/expert-costs"),
  saveExpertCostsToSession,
  postExpertCosts,
);

paFormRouter.get("/check-your-answers", getCheckYourAnswersPage);

paFormRouter.post("/check-your-answers", saveToDrafts, postCheckYourAnswers);

paFormRouter.get("/confirmation-page", getConfirmationPage);

paFormRouter.get("/no-prior-authority-needed", getNoPriorAuthorityNeededPage);

paFormRouter.use("/search-an-expert-type", loadExpertTypesMiddleware);

paFormRouter.get("/search-an-expert-type", getSearchAnExpertTypePage);

paFormRouter.post(
  "/search-an-expert-type",
  saveToDrafts,
  validateData(typeOfExpertSchema, "pa-form/search-an-expert-type"),
  saveToSession<
    { PriorAuthorityExpertType: PriorAuthorityExpertType },
    "expertType"
  >("expertType", (body) => body.PriorAuthorityExpertType),
  postExpertType,
);

paFormRouter.get("/is-guideline-rate-exceeded", getGuidelineRatesExceededPage);

paFormRouter.post(
  "/is-guideline-rate-exceeded",
  saveToDrafts,
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

paFormRouter.get("/no-prior-authority-needed", getNoPriorAuthorityNeededPage);

paFormRouter.get("/expert-based-in-london", getExpertBasedInLondonPage);

paFormRouter.post(
  "/expert-based-in-london",
  saveToDrafts,
  validateData(expertBasedInLondonSchema, "pa-form/expert-based-in-london.njk"),
  saveToSession<
    { expertBasedInLondon: PriorAuthorityExpertBasedInLondon },
    "expertBasedInLondon"
  >("expertBasedInLondon", (body) => body.expertBasedInLondon),
  postExpertBasedInLondonPage,
);

export default paFormRouter;
