import express from "express";

import {
  getConfirmationPage,
  getExpertCostsPage,
  getNoPriorAuthorityNeededPage,
  getPaTypePage,
  getSearchAnExpertTypePage,
  getStartPage,
  postExpertType,
  postExpertCosts,
  postGuidelineRatesExceededPage,
  postPriorAuthorityType,
  getGuidelineRatesExceededPage,
} from "#src/controllers/pa-form.controller.js";
import {
  expertCosts,
  fullNameOfExpert,
  guidelineRatesExceeded,
  typeOfPriorAuthority,
  typeOfExpert,
} from "#src/validation/prior-authority.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import { saveToSession } from "#src/middleware/saveToSession.js";
import type {
  PriorAuthorityExpertFullName,
  PriorAuthorityExpertType,
  PriorAuthorityIsGuidelineRateExceeded,
  PriorAuthorityType,
  PriorAuthorityBillingType,
} from "#src/types/prior-authority.js";
import { loadExpertTypesMiddleware } from "#src/middleware/loadExpertTypes.js";

const paFormRouter = express.Router();

// TODO This can be removed once the app has a landing page
paFormRouter.get("/", getStartPage);

paFormRouter.get("/pa-form/start-page", getStartPage);

paFormRouter.get("/pa-form/type-pa", getPaTypePage);

paFormRouter.post(
  "/pa-form/type-pa",
  validateData(typeOfPriorAuthority, "pa-form/type-pa"),
  saveToSession<{ PriorAuthorityType: PriorAuthorityType }, "type">(
    "type",
    (body) => body.PriorAuthorityType,
  ),
  postPriorAuthorityType,
);
interface ExpertCostsBody {
  PriorAuthorityExpertFullName: PriorAuthorityExpertFullName;
  PriorAuthorityBillingType: PriorAuthorityBillingType;
  PriorAuthorityHourlyRate?: string;
  PriorAuthorityEstimatedHours?: string;
  PriorAuthorityEstimatedMinutes?: string;
  PriorAuthorityTotalAmount?: string;
  PriorAuthorityFlatRateTotalAmount?: string;
};

paFormRouter.get("/pa-form/expert-costs", getExpertCostsPage);

paFormRouter.post(
  "/pa-form/expert-costs",
  validateData(expertCosts, "pa-form/expert-costs"),
  saveToSession<ExpertCostsBody, "fullName">("fullName", (body) => body.PriorAuthorityExpertFullName),
  saveToSession<ExpertCostsBody, "billingType">("billingType", (body) => body.PriorAuthorityBillingType),
  saveToSession<ExpertCostsBody, "hourlyRate">("hourlyRate", (body) => body.PriorAuthorityHourlyRate),
  saveToSession<ExpertCostsBody, "estimatedHours">("estimatedHours", (body) => body.PriorAuthorityEstimatedHours),
  saveToSession<ExpertCostsBody, "estimatedMinutes">("estimatedMinutes", (body) => body.PriorAuthorityEstimatedMinutes),
  saveToSession<ExpertCostsBody, "totalAmount">("totalAmount", (body) => body.PriorAuthorityTotalAmount),
  saveToSession<ExpertCostsBody, "flatRateTotalAmount">("flatRateTotalAmount", (body) => body.PriorAuthorityFlatRateTotalAmount),
  postExpertCosts,
);

paFormRouter.get("/pa-form/confirmation-page", getConfirmationPage);

paFormRouter.get(
  "/pa-form/no-prior-authority-needed",
  getNoPriorAuthorityNeededPage,
);

paFormRouter.use("/pa-form/search-an-expert-type", loadExpertTypesMiddleware);

paFormRouter.get("/pa-form/search-an-expert-type", getSearchAnExpertTypePage);

paFormRouter.post(
  "/pa-form/search-an-expert-type",
  validateData(typeOfExpert, "pa-form/search-an-expert-type"),
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
    guidelineRatesExceeded,
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
