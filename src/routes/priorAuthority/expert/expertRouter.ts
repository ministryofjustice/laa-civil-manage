import express from "express";

import {
  getCostsSharedPage,
  getExpertBasedInLondonPage,
  getExpertCheckYourAnswersPage,
  getExpertCostsPage,
  getExpertDetailsPage,
  getExpertLandingPage,
  getJustificationPage,
  postCostsSharedPage,
  postExpertBasedInLondonPage,
  postExpertCheckYourAnswers,
  postExpertCosts,
  getApportionedDetailsPage,
  postApportionedDetails,
  postExpertDetails,
  postJustificationPage,
} from "#src/controllers/priorAuthority/expert/expertController.js";
import { getConfirmationPage as getSharedConfirmationPage } from "#src/controllers/priorAuthority/shared/sharedController.js";
import { calculateCosts } from "#src/middleware/priorAuthority/expert/calculateCosts.js";
import { createDocumentUploadRouter } from "#src/routes/documentUploadRouter.js";
import { loadExpertTypesMiddleware } from "#src/middleware/priorAuthority/expert/loadExpertTypes.js";
import { saveToDrafts } from "#src/middleware/priorAuthority/shared/saveToDrafts.js";
import { saveExpertCostsToSession } from "#src/middleware/priorAuthority/expert/saveExpertCostsToSession.js";
import { saveExpert } from "#src/middleware/priorAuthority/shared/saveToSession.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import { justificationBackLink } from "#src/utils/priorAuthority/expert/justificationBackLink.js";
import type {
  PriorAuthorityCostsShared,
  PriorAuthorityExpertBasedInLondon,
  PriorAuthorityExpertFullName,
  PriorAuthorityExpertType,
} from "#src/types/priorAuthority/expert.js";
import {
  costsSharedSchema,
  expertBasedInLondonSchema,
  expertCostsSchema,
  expertDetailsSchema,
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

expertRouter.get("/costs", getExpertCostsPage);

expertRouter.post(
  "/costs",
  calculateCosts,
  saveExpertCostsToSession,
  saveToDrafts,
  validateData(expertCostsSchema, "priorAuthority/expert/expertCosts"),
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
  saveToDrafts,
  (
    req: express.Request<unknown, unknown, ApportionedDetailsBody>,
    _res: express.Response,
    next: express.NextFunction,
  ) => {
    const expert = req.session.priorAuthority?.expert;
    req.body.expertCost = expert?.totalAmount ?? expert?.fixedRateTotalAmount;
    next();
  },
  validateData(
    apportionedDetailsSchema,
    "priorAuthority/expert/apportionedDetails",
  ),
  postApportionedDetails,
);

expertRouter.use("/details", loadExpertTypesMiddleware);

expertRouter.get("/details", getExpertDetailsPage);

expertRouter.post(
  "/details",
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
  validateData(expertDetailsSchema, "priorAuthority/expert/expertDetails"),
  postExpertDetails,
);

expertRouter.get("/based-in-london", getExpertBasedInLondonPage);

expertRouter.post(
  "/based-in-london",
  saveExpert(
    "expertBasedInLondon",
    (body: { expertBasedInLondon: PriorAuthorityExpertBasedInLondon }) =>
      body.expertBasedInLondon,
  ),
  saveToDrafts,
  validateData(
    expertBasedInLondonSchema,
    "priorAuthority/expert/expertBasedInLondon",
  ),
  postExpertBasedInLondonPage,
);

expertRouter.get("/costs-shared", getCostsSharedPage);

expertRouter.post(
  "/costs-shared",
  saveExpert(
    "costsSharedWithOtherParties",
    (body: { CostsShared: PriorAuthorityCostsShared }) => body.CostsShared,
  ),
  saveToDrafts,
  validateData(
    costsSharedSchema,
    "priorAuthority/expert/costsSharedWithOtherParties",
  ),
  postCostsSharedPage,
);

expertRouter.get("/justification", getJustificationPage);

expertRouter.post(
  "/justification",
  (req, res, next) => {
    res.locals.backLinkHref = justificationBackLink(
      req.session.priorAuthority?.expert,
    );
    res.locals.formAction = "/prior-authority/expert/justification";
    res.locals.hintText =
      "Provide a background to the case that demonstrates the relevant circumstances and explanation of the specific expertise or disbursement required.";
    next();
  },
  saveExpert(
    "justification",
    (body: { justification: string }) => body.justification,
  ),
  saveToDrafts,
  validateData(justificationSchema, "priorAuthority/justificationPage"),
  postJustificationPage,
);

expertRouter.get("/check-your-answers", getExpertCheckYourAnswersPage);

expertRouter.post(
  "/check-your-answers",
  saveToDrafts,
  postExpertCheckYourAnswers,
);

expertRouter.use(
  createDocumentUploadRouter({
    section: "expert",
    basePath: "/prior-authority/expert",
    backLinkHref: "/prior-authority/expert/justification",
    continueRedirect: "/prior-authority/expert/check-your-answers",
    introTemplate: "priorAuthority/expert/documentUploadIntro.njk",
  }),
);

expertRouter.get("/confirmation-page", getSharedConfirmationPage);

expertRouter.get("/", getExpertLandingPage);

export default expertRouter;
