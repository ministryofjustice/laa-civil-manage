import express from "express";

import {
  getConfirmationPage,
  getExpertDetailsPage,
  getPaTypePage,
  getStartPage,
  postExpertDetails,
  postPriorAuthorityType,
} from "#src/controllers/pa-form.controller.js";
import {
  fullNameOfExpert,
  typeOfPriorAuthority,
} from "#src/validation/type-pa.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import { saveToSession } from "#src/middleware/saveToSession.js";
import type {
  PriorAuthorityExpertFullName,
  PriorAuthorityType,
} from "#src/types/prior-authority.js";

const paFormRouter = express.Router();

// TODO This can be removed once the app has a landing page
paFormRouter.get("/", getStartPage);

paFormRouter.get("/pa-form/start-page", getStartPage);

paFormRouter.get("/pa-form/type-pa", getPaTypePage);

paFormRouter.post(
  "/pa-form/type-pa",
  validateData(typeOfPriorAuthority, "pa-form/type-pa"),
  saveToSession<{ PriorAuthorityType: PriorAuthorityType }, "type">(
    "type",
    (body) => body.PriorAuthorityType,
  ),
  postPriorAuthorityType,
);
paFormRouter.get("/pa-form/expert-details", getExpertDetailsPage);

paFormRouter.post(
  "/pa-form/expert-details",
  validateData(fullNameOfExpert, "pa-form/expert-details"),
  saveToSession<
    { PriorAuthorityExpertFullName: PriorAuthorityExpertFullName },
    "fullName"
  >("fullName", (body) => body.PriorAuthorityExpertFullName),
  postExpertDetails,
);

paFormRouter.get("/pa-form/confirmation-page", getConfirmationPage);

export default paFormRouter;
