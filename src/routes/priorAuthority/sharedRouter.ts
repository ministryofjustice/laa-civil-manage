import express from "express";

import {
  getNoPriorAuthorityNeededPage,
  getPriorAuthorityTypePage,
  postPriorAuthorityType,
} from "#src/controllers/priorAuthority/shared/sharedController.js";
import { saveToDrafts } from "#src/middleware/priorAuthority/shared/saveToDrafts.js";
import { savePriorAuthorityType } from "#src/middleware/priorAuthority/shared/saveToSession.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import type { PriorAuthorityType } from "#src/types/priorAuthority/shared.js";
import { typeOfPriorAuthoritySchema } from "#src/validation/priorAuthority/shared/sharedValidation.js";

const sharedRouter = express.Router();

sharedRouter.get("/type", getPriorAuthorityTypePage);

sharedRouter.post(
  "/type",
  savePriorAuthorityType<{ PriorAuthorityType: PriorAuthorityType }>(
    (body: { PriorAuthorityType: PriorAuthorityType }) =>
      body.PriorAuthorityType,
  ),
  saveToDrafts,
  validateData(
    typeOfPriorAuthoritySchema,
    "priorAuthorityForm/typePriorAuthority",
  ),
  postPriorAuthorityType,
);

sharedRouter.get(
  "/expert/no-prior-authority-needed",
  getNoPriorAuthorityNeededPage,
);

export default sharedRouter;
