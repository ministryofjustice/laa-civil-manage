import express from "express";

import {
  getConfirmationPage,
  getPaTypePage,
  getStartPage,
  postPriorAuthorityType,
} from "#src/controllers/pa-form.controller.js";
import { typeOfPriorAuthority } from "#src/validation/type-pa.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import { saveToSession } from "#src/middleware/saveToSession.js";

const paFormRouter = express.Router();

// TODO This can be removed once the app has a landing page
paFormRouter.get("/", getStartPage);

paFormRouter.get("/pa-form/start-page", getStartPage);

paFormRouter.get("/pa-form/type-pa", getPaTypePage);

paFormRouter.post(
  "/pa-form/type-pa",
  validateData(typeOfPriorAuthority, "pa-form/type-pa"),
  saveToSession<{ PriorAuthorityType: string }>(
    "type",
    (body) => body.PriorAuthorityType,
  ),
  postPriorAuthorityType,
);

paFormRouter.get("/pa-form/confirmation-page", getConfirmationPage);

export default paFormRouter;
