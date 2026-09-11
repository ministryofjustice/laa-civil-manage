import express from "express";

import {
  getCostsSharedPage,
  getExpertPostcodePage,
  getExpertCheckYourAnswersPage,
  getExpertCostsPage,
  getExpertTypePage,
  getExpertLandingPage,
  getJustificationPage,
  getProviderNamePage,
  getOtherExpertTypePage,
  postCostsSharedPage,
  postExpertPostcodePage,
  postExpertCheckYourAnswers,
  postExpertCosts,
  getApportionedDetailsPage,
  postApportionedDetails,
  postExpertType,
  postProviderName,
  postOtherExpertType,
  postJustificationPage,
  postStartExpertJourney,
  saveExpertTypeSelection,
} from "#src/controllers/priorAuthority/expert/expertController.js";
import { getConfirmationPage as getSharedConfirmationPage } from "#src/controllers/priorAuthority/shared/sharedController.js";
import { calculateCosts } from "#src/middleware/priorAuthority/expert/calculateCosts.js";
import { createDocumentUploadRouter } from "#src/routes/documentUploadRouter.js";
import { loadExpertTypesMiddleware } from "#src/middleware/priorAuthority/expert/loadExpertTypes.js";
import { saveExpertCostsToSession } from "#src/middleware/priorAuthority/expert/saveExpertCostsToSession.js";
import {
  loadPriorAuthority,
  persistPriorAuthority,
  saveExpert,
} from "#src/middleware/priorAuthority/shared/saveToSession.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import { justificationBackLink } from "#src/utils/priorAuthority/expert/justificationBackLink.js";
import { formatPostcode } from "#src/utils/priorAuthority/expert/formatPostcode.js";
import type {
  PriorAuthorityCostsShared,
  PriorAuthorityExpertPostcode,
  PriorAuthorityExpertFullName,
  PriorAuthorityExpertType,
} from "#src/types/priorAuthority/expert.js";
import {
  costsSharedSchema,
  expertPostcodeSchema,
  expertCostsSchema,
  buildExpertTypeSchema,
  fullNameOfExpertSchema,
  otherExpertTypeSchema,
  justificationSchema,
  apportionedDetailsSchema,
} from "#src/validation/priorAuthority/expert/expertValidation.js";

const expertRouter = express.Router();

interface ExpertDetailsBody {
  PriorAuthorityExpertType: PriorAuthorityExpertType;
  PriorAuthorityExpertTypeOther?: PriorAuthorityExpertType;
  PriorAuthorityExpertFullName: PriorAuthorityExpertFullName;
}

interface ApportionedDetailsBody {
  PriorAuthorityNumberOfParties: string;
  PriorAuthorityApportionedAmount: string;
  expertCost?: string;
}

// No draft exists yet at this point (or, for confirmation-page, not anymore
// since submit clears it), so these must be registered before loadPriorAuthority below.
expertRouter.get("/", getExpertLandingPage);
expertRouter.post("/", postStartExpertJourney);
expertRouter.get("/confirmation-page", getSharedConfirmationPage);

expertRouter.use(loadPriorAuthority("expert"));

expertRouter.get("/costs", getExpertCostsPage);

expertRouter.post(
  "/costs",
  calculateCosts,
  saveExpertCostsToSession,
  validateData(expertCostsSchema, "priorAuthority/expert/expertCosts"),
  persistPriorAuthority,
  postExpertCosts,
);

expertRouter.get("/share-of-costs", getApportionedDetailsPage);

expertRouter.post(
  "/share-of-costs",
  saveExpert(
    "numberOfParties",
    (body: ApportionedDetailsBody) => body.PriorAuthorityNumberOfParties,
  ),
  saveExpert(
    "apportionedAmount",
    (body: ApportionedDetailsBody) => body.PriorAuthorityApportionedAmount,
  ),
  (
    req: express.Request<unknown, unknown, ApportionedDetailsBody>,
    _res: express.Response,
    next: express.NextFunction,
  ) => {
    const expert = req.priorAuthority?.expert;
    req.body.expertCost = expert?.totalAmount ?? expert?.fixedRateTotalAmount;
    next();
  },
  validateData(
    apportionedDetailsSchema,
    "priorAuthority/expert/apportionedDetails",
  ),
  persistPriorAuthority,
  postApportionedDetails,
);

expertRouter.use("/expert-type", loadExpertTypesMiddleware);

expertRouter.get("/expert-type", getExpertTypePage);

expertRouter.post(
  "/expert-type",
  saveExpertTypeSelection,
  validateData((_req, res) => {
    const expertTypes = (res.locals.expertTypes ?? []) as Array<{
      value: string;
    }>;
    const allowedExpertTypes = expertTypes
      .map((option) => option.value)
      .filter((value) => value !== "" && value !== "Other");

    return buildExpertTypeSchema(allowedExpertTypes);
  }, "priorAuthority/expert/expertType"),
  persistPriorAuthority,
  postExpertType,
);

expertRouter.use("/other-expert-type", loadExpertTypesMiddleware);

expertRouter.get("/other-expert-type", getOtherExpertTypePage);

expertRouter.post(
  "/other-expert-type",
  saveExpert(
    "expertType",
    (body: ExpertDetailsBody) => body.PriorAuthorityExpertTypeOther,
  ),
  validateData(otherExpertTypeSchema, "priorAuthority/expert/otherExpertType"),
  persistPriorAuthority,
  postOtherExpertType,
);

expertRouter.use("/provider-name", loadExpertTypesMiddleware);

expertRouter.get("/provider-name", getProviderNamePage);

expertRouter.post(
  "/provider-name",
  saveExpert(
    "fullName",
    (body: ExpertDetailsBody) => body.PriorAuthorityExpertFullName,
  ),
  validateData(fullNameOfExpertSchema, "priorAuthority/expert/providerName"),
  persistPriorAuthority,
  postProviderName,
);

expertRouter.get("/postcode", getExpertPostcodePage);

expertRouter.post(
  "/postcode",
  saveExpert(
    "expertPostcode",
    (body: { PriorAuthorityExpertPostcode: PriorAuthorityExpertPostcode }) =>
      formatPostcode(body.PriorAuthorityExpertPostcode),
  ),
  validateData(expertPostcodeSchema, "priorAuthority/expert/expertPostcode"),
  persistPriorAuthority,
  postExpertPostcodePage,
);

expertRouter.get("/costs-shared", getCostsSharedPage);

expertRouter.post(
  "/costs-shared",
  saveExpert(
    "costsSharedWithOtherParties",
    (body: { CostsShared: PriorAuthorityCostsShared }) => body.CostsShared,
  ),
  validateData(
    costsSharedSchema,
    "priorAuthority/expert/costsSharedWithOtherParties",
  ),
  persistPriorAuthority,
  postCostsSharedPage,
);

expertRouter.get("/justification", getJustificationPage);

expertRouter.post(
  "/justification",
  (req, res, next) => {
    res.locals.backLinkHref = justificationBackLink(req.priorAuthority?.expert);
    res.locals.formAction = "/prior-authority/expert/justification";
    res.locals.hintText =
      "For example, any special circumstances that support your application";
    next();
  },
  saveExpert(
    "justification",
    (body: { justification: string }) => body.justification,
  ),
  validateData(justificationSchema, "priorAuthority/justificationPage"),
  persistPriorAuthority,
  postJustificationPage,
);

expertRouter.get("/check-your-answers", getExpertCheckYourAnswersPage);

expertRouter.post("/check-your-answers", postExpertCheckYourAnswers);

expertRouter.use(
  createDocumentUploadRouter({
    section: "expert",
    basePath: "/prior-authority/expert",
    backLinkHref: "/prior-authority/expert/justification",
    continueRedirect: "/prior-authority/expert/check-your-answers",
    introTemplate: "priorAuthority/expert/documentUploadIntro.njk",
    pdfOnly: true,
  }),
);

export default expertRouter;
