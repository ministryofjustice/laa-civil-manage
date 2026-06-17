import express from "express";

import {
  getCheckYourAnswersPage,
  getConfirmationPage,
  getExpertCostsPage,
  getNoPriorAuthorityNeededPage,
  getPriorAuthorityTypePage,
  getExpertDetailsPage,
  getStartPage,
  postCheckYourAnswers,
  postExpertDetails,
  postExpertCosts,
  postPriorAuthorityType,
  postGuidelineRatesExceededPage,
  getGuidelineRatesExceededPage,
  getExpertBasedInLondonPage,
  postExpertBasedInLondonPage,
} from "#src/controllers/priorAuthorityFormController.js";
import {
  expertCostsSchema,
  guidelineRatesExceededSchema,
  typeOfPriorAuthoritySchema,
  expertDetailsSchema,
  expertBasedInLondonSchema,
} from "#src/validation/priorAuthority.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import { saveToSession } from "#src/middleware/saveToSession.js";
import { saveExpertCostsToSession } from "#src/middleware/saveExpertCostsToSession.js";
import type {
  PriorAuthorityExpertBasedInLondon,
  PriorAuthorityExpertFullName,
  PriorAuthorityExpertType,
  PriorAuthorityIsGuidelineRateExceeded,
  PriorAuthorityType,
} from "#src/types/priorAuthority.js";
import { loadExpertTypesMiddleware } from "#src/middleware/loadExpertTypes.js";
import { saveToSessionFromDrafts } from "#src/middleware/saveToSessionFromDrafts.js";
import { saveToDrafts } from "#src/middleware/saveToDrafts.js";
import { calculateCosts } from "#src/middleware/calculateCosts.js";
import { rateLimiter } from "#src/middleware/rateLimiter.js";

const priorAuthorityFormRouter = express.Router();

priorAuthorityFormRouter.get(
  "/start-page",
  rateLimiter,
  saveToSessionFromDrafts,
  getStartPage,
);

priorAuthorityFormRouter.get(
  "/type-prior-authority",
  rateLimiter,
  getPriorAuthorityTypePage,
);

priorAuthorityFormRouter.post(
  "/type-prior-authority",
  rateLimiter,
  saveToSession<{ PriorAuthorityType: PriorAuthorityType }, "type">(
    "type",
    (body) => body.PriorAuthorityType,
  ),
  saveToDrafts,
  validateData(
    typeOfPriorAuthoritySchema,
    "priorAuthorityForm/typePriorAuthority",
  ),
  postPriorAuthorityType,
);

priorAuthorityFormRouter.get("/expert-costs", getExpertCostsPage);

priorAuthorityFormRouter.post(
  "/expert-costs",
  rateLimiter,
  calculateCosts,
  saveExpertCostsToSession,
  saveToDrafts,
  validateData(expertCostsSchema, "priorAuthorityForm/expertCosts"),
  postExpertCosts,
);

priorAuthorityFormRouter.get(
  "/check-your-answers",
  rateLimiter,
  getCheckYourAnswersPage,
);

priorAuthorityFormRouter.post(
  "/check-your-answers",
  saveToDrafts,
  postCheckYourAnswers,
);

priorAuthorityFormRouter.get(
  "/confirmation-page",
  rateLimiter,
  getConfirmationPage,
);

priorAuthorityFormRouter.get(
  "/no-prior-authority-needed",
  rateLimiter,
  getNoPriorAuthorityNeededPage,
);

priorAuthorityFormRouter.use("/expert-details", loadExpertTypesMiddleware);

priorAuthorityFormRouter.get("/expert-details", getExpertDetailsPage);

priorAuthorityFormRouter.post(
  "/expert-details",
  saveToSession<
    {
      PriorAuthorityExpertType: PriorAuthorityExpertType;
      PriorAuthorityExpertTypeOther?: PriorAuthorityExpertType;
      PriorAuthorityExpertFullName: PriorAuthorityExpertFullName;
    },
    "expertType"
  >("expertType", (body) =>
    body.PriorAuthorityExpertType === "Other"
      ? body.PriorAuthorityExpertTypeOther
      : body.PriorAuthorityExpertType,
  ),
  saveToSession<
    {
      PriorAuthorityExpertFullName: PriorAuthorityExpertFullName;
    },
    "fullName"
  >("fullName", (body) => body.PriorAuthorityExpertFullName),
  saveToDrafts,
  validateData(expertDetailsSchema, "priorAuthorityForm/expertDetails"),
  postExpertDetails,
);

priorAuthorityFormRouter.get(
  "/is-guideline-rate-exceeded",
  getGuidelineRatesExceededPage,
);

priorAuthorityFormRouter.post(
  "/is-guideline-rate-exceeded",
  saveToSession<
    { GuidelineRatesExceeded: PriorAuthorityIsGuidelineRateExceeded },
    "guidelineRatesExceeded"
  >("guidelineRatesExceeded", (body) => body.GuidelineRatesExceeded),
  saveToDrafts,
  validateData(
    guidelineRatesExceededSchema,
    "priorAuthorityForm/isGuidelineRateExceeded.njk",
  ),
  postGuidelineRatesExceededPage,
);

priorAuthorityFormRouter.get(
  "/no-prior-authority-needed",
  getNoPriorAuthorityNeededPage,
);

priorAuthorityFormRouter.get(
  "/expert-based-in-london",
  getExpertBasedInLondonPage,
);

priorAuthorityFormRouter.post(
  "/expert-based-in-london",
  saveToSession<
    { expertBasedInLondon: PriorAuthorityExpertBasedInLondon },
    "expertBasedInLondon"
  >("expertBasedInLondon", (body) => body.expertBasedInLondon),
  saveToDrafts,
  validateData(
    expertBasedInLondonSchema,
    "priorAuthorityForm/expertBasedInLondon.njk",
  ),
  postExpertBasedInLondonPage,
);

export default priorAuthorityFormRouter;
