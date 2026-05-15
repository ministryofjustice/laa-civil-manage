import express from "express";

import {
  getConfirmationPage,
  getExpertDetailsPage,
  getNoPriorAuthorityNeededPage,
  getPaTypePage,
  getSearchAnExpertTypePage,
  getStartPage,
  postExpertType,
  postExpertDetails,
  postGuidelineRatesExceededPage,
  postPriorAuthorityType,
  getGuidelineRatesExceededPage,
} from "#src/controllers/pa-form.controller.js";
import {
  fullNameOfExpert,
  guidelineRatesExceeded,
  typeOfPriorAuthority,
} from "#src/validation/type-pa.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import { saveToSession } from "#src/middleware/saveToSession.js";
import type {
  PriorAuthorityExpertFullName,
  PriorAuthorityExpertType,
  PriorAuthorityIsGuidelineRateExceeded,
  PriorAuthorityType,
} from "#src/types/prior-authority.js";
import { typeOfExpert } from "#src/validation/expert-type.js";
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
paFormRouter.get("/pa-form/expert-details", getExpertDetailsPage);

paFormRouter.post(
  "/pa-form/expert-details",
  validateData(fullNameOfExpert, "pa-form/expert-details"),
  saveToSession<
    { PriorAuthorityExpertFullName: PriorAuthorityExpertFullName },
    "fullName"
  >("fullName", (body) => body.PriorAuthorityExpertFullName),
  postExpertDetails,
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
