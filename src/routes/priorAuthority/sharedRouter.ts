import express from "express";

import {
  getCheckYourAnswersPage,
  getConfirmationPage,
  getNoPriorAuthorityNeededPage,
  getPriorAuthorityTypePage,
  getStartPage,
  postCheckYourAnswers,
  postPriorAuthorityType,
} from "#src/controllers/priorAuthority/shared/sharedController.js";
import { saveToDrafts } from "#src/middleware/priorAuthority/shared/saveToDrafts.js";
import { saveToSession } from "#src/middleware/priorAuthority/shared/saveToSession.js";
import { saveToSessionFromDrafts } from "#src/middleware/priorAuthority/shared/saveToSessionFromDrafts.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import type { PriorAuthorityType } from "#src/types/priorAuthority/form.js";
import { typeOfPriorAuthoritySchema } from "#src/validation/priorAuthority/shared/sharedValidation.js";

const sharedRouter = express.Router();

sharedRouter.get("/start-page", saveToSessionFromDrafts, getStartPage);

sharedRouter.get("/type-prior-authority", getPriorAuthorityTypePage);

sharedRouter.post(
  "/type-prior-authority",
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
