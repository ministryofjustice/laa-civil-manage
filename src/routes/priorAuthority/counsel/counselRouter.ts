import express from "express";
import {
  getCounselJustificationPage,
  getCounselLandingPage,
  getCounselTypePage,
  postCounselType,
  postCounselJustification,
} from "#src/controllers/priorAuthority/counsel/counselController.js";
import { saveToSession } from "#src/middleware/priorAuthority/shared/saveToSession.js";
import { saveToDrafts } from "#src/middleware/priorAuthority/shared/saveToDrafts.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import { counselTypeSchema } from "#src/validation/priorAuthority/counsel/CounselValidation.js";
import type { counselType } from "#src/types/priorAuthority/counsel.js";

const counselRouter = express.Router();

counselRouter.get("/", getCounselLandingPage);
counselRouter.get("/type", getCounselTypePage);
counselRouter.get("/justification", getCounselJustificationPage);
counselRouter.post(
  "/type",
  saveToSession<
    {
      CounselType: counselType;
    },
    "counsel"
  >("counsel", (body, priorAuthority) => ({
    ...priorAuthority.counsel,
    counselType: body.CounselType,
  })),
  saveToDrafts,
  validateData(counselTypeSchema, "priorAuthorityForm/counsel/counselType"),
  postCounselType,
);

counselRouter.post(
  "/justification",
  saveToSession<{ justification: string }, "counsel">(
    "counsel",
    (body, priorAuthority) => ({
      ...priorAuthority.counsel,
      justification: body.justification,
    }),
  ),
  postCounselJustification,
);

export default counselRouter;
