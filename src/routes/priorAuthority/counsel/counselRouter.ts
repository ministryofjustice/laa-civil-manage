import express from "express";
import {
  getCounselLandingPage,
  getCounselTypePage,
  postCounselType,
} from "#src/controllers/priorAuthority/counsel/counselController.js";
import { saveToSession } from "#src/middleware/priorAuthority/shared/saveToSession.js";
import { saveToDrafts } from "#src/middleware/priorAuthority/shared/saveToDrafts.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import { counselTypeSchema } from "#src/validation/priorAuthority/counsel/CounselValidation.js";
import type { counselType } from "#src/types/priorAuthority/counsel.js";

const counselRouter = express.Router();

counselRouter.get("/", getCounselLandingPage);
counselRouter.get("/type", getCounselTypePage);
counselRouter.post(
  "/type",
  saveToSession<
    {
      CounselType: counselType;
    },
    "counselType"
  >("counselType", (body) => body.CounselType),
  saveToDrafts,
  validateData(counselTypeSchema, "priorAuthorityForm/counsel/counselType"),
  postCounselType,
);

export default counselRouter;
