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
  saveCounsel(
    "justification",
    (body: { justification: string }) => body.justification,
  ),
  saveToDrafts,
  validateData(
    counselJustificationSchema,
    "priorAuthorityForm/counsel/counselJustificationPage",
  ),
  postCounselJustification,
);

export default counselRouter;
