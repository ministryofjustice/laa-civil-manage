import express from "express";

import {
  getCheckYourAnswersPage,
  getConfirmationPage,
  getCounselLandingPage,
  getExpertLandingPage,
  getNoPriorAuthorityNeededPage,
  getPriorAuthorityTypePage,
  postCheckYourAnswers,
  postPriorAuthorityType,
} from "#src/controllers/priorAuthority/shared/sharedController.js";
import { saveToDrafts } from "#src/middleware/priorAuthority/shared/saveToDrafts.js";
import { saveToSession } from "#src/middleware/priorAuthority/shared/saveToSession.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import type { PriorAuthorityType } from "#src/types/priorAuthority/form.js";
import { typeOfPriorAuthoritySchema } from "#src/validation/priorAuthority/shared/sharedValidation.js";

const sharedRouter = express.Router();

sharedRouter.get("/expert", getExpertLandingPage);
sharedRouter.get("/counsel", getCounselLandingPage);

sharedRouter.get("/prior-authority-type", getPriorAuthorityTypePage);

sharedRouter.post(
  "/prior-authority-type",
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

sharedRouter.get("/check-your-answers", getCheckYourAnswersPage);

sharedRouter.post("/check-your-answers", saveToDrafts, postCheckYourAnswers);

sharedRouter.get("/confirmation-page", getConfirmationPage);

sharedRouter.get("/no-prior-authority-needed", getNoPriorAuthorityNeededPage);

export default sharedRouter;
