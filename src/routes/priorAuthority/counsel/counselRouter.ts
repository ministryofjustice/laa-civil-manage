import express from "express";
import {
  getCounselCheckYourAnswersPage,
  getCounselJustificationPage,
  getCounselLandingPage,
  getCounselTypePage,
  postCounselCheckYourAnswers,
  postCounselType,
  postCounselJustification,
  postStartCounselJourney,
} from "#src/controllers/priorAuthority/counsel/counselController.js";
import { getConfirmationPage as getSharedConfirmationPage } from "#src/controllers/priorAuthority/shared/sharedController.js";
import {
  loadPriorAuthority,
  persistPriorAuthority,
  saveCounsel,
} from "#src/middleware/priorAuthority/shared/saveToSession.js";
import { createDocumentUploadRouter } from "#src/routes/documentUploadRouter.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import {
  counselTypeSchema,
  counselJustificationSchema,
} from "#src/validation/priorAuthority/counsel/CounselValidation.js";
import type { counselType } from "#src/types/priorAuthority/counsel.js";

const counselRouter = express.Router();

// No draft exists yet at this point (or, for confirmation-page, not anymore
// since submit clears it), so these must be registered before loadPriorAuthority below.
counselRouter.get("/", getCounselLandingPage);
counselRouter.post("/", postStartCounselJourney);
counselRouter.get("/confirmation-page", getSharedConfirmationPage);

counselRouter.use(loadPriorAuthority("counsel"));

counselRouter.get("/type", getCounselTypePage);
counselRouter.get("/justification", getCounselJustificationPage);
counselRouter.post(
  "/type",
  saveCounsel(
    "counselType",
    (body: { CounselType: counselType }) => body.CounselType,
  ),
  validateData(counselTypeSchema, "priorAuthority/counsel/counselType"),
  persistPriorAuthority,
  postCounselType,
);

counselRouter.post(
  "/justification",
  (req, res, next) => {
    res.locals.backLinkHref = "/prior-authority/counsel/type";
    res.locals.formAction = "/prior-authority/counsel/justification";
    res.locals.heading = "Why is this application necessary?";
    res.locals.hintText =
      "Provide a background to the case that demonstrates relevant circumstances and explanation of the specific expertise required";
    next();
  },
  saveCounsel(
    "justification",
    (body: { justification: string }) => body.justification,
  ),
  validateData(counselJustificationSchema, "priorAuthority/justificationPage"),
  persistPriorAuthority,
  postCounselJustification,
);

counselRouter.use(
  createDocumentUploadRouter({
    section: "counsel",
    basePath: "/prior-authority/counsel",
    backLinkHref: "/prior-authority/counsel/justification",
    continueRedirect: "/prior-authority/counsel/check-your-answers",
    introTemplate: "priorAuthority/counsel/documentUploadIntro.njk",
  }),
);

counselRouter.get("/check-your-answers", getCounselCheckYourAnswersPage);

counselRouter.post("/check-your-answers", postCounselCheckYourAnswers);

export default counselRouter;
