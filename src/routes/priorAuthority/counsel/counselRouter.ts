import express from "express";
import {
  getCounselJustificationPage,
  getCounselLandingPage,
  getCounselTypePage,
  postCounselType,
  postCounselJustification,
} from "#src/controllers/priorAuthority/counsel/counselController.js";
import { saveCounsel } from "#src/middleware/priorAuthority/shared/saveToSession.js";
import { saveToDrafts } from "#src/middleware/priorAuthority/shared/saveToDrafts.js";
import { createDocumentUploadRouter } from "#src/routes/documentUploadRouter.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import {
  counselTypeSchema,
  counselJustificationSchema,
} from "#src/validation/priorAuthority/counsel/CounselValidation.js";
import type { counselType } from "#src/types/priorAuthority/counsel.js";

const counselRouter = express.Router();

counselRouter.get("/", getCounselLandingPage);
counselRouter.get("/type", getCounselTypePage);
counselRouter.get("/justification", getCounselJustificationPage);
counselRouter.post(
  "/type",
  saveCounsel(
    "counselType",
    (body: { CounselType: counselType }) => body.CounselType,
  ),
  saveToDrafts,
  validateData(counselTypeSchema, "priorAuthorityForm/counsel/counselType"),
  postCounselType,
);

counselRouter.post(
  "/justification",
  (req, res, next) => {
    res.locals.backLinkHref = "/prior-authority/counsel/type";
    res.locals.formAction = "/prior-authority/counsel/justification";
    res.locals.hintText =
      "Provide a background to the case that demonstrates relevant circumstances and explanation of the specific expertise required.";
    next();
  },
  saveCounsel(
    "justification",
    (body: { justification: string }) => body.justification,
  ),
  saveToDrafts,
  validateData(
    counselJustificationSchema,
    "priorAuthorityForm/justificationPage",
  ),
  postCounselJustification,
);

counselRouter.use(
  createDocumentUploadRouter({
    section: "counsel",
    basePath: "/prior-authority/counsel",
    backLinkHref: "/prior-authority/counsel/justification",
    continueRedirect: "/prior-authority/counsel/check-your-answers",
    introTemplate: "priorAuthorityForm/counsel/documentUploadIntro.njk",
  }),
);

export default counselRouter;
