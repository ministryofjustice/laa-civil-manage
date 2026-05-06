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
  priorAuthorityExpertFullNameSchema,
  priorAuthorityTypeSchema,
} from "#src/validation/prior-authority.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import { saveToSession } from "#src/middleware/saveToSession.js";
import type {
  PriorAuthorityFullName,
  PriorAuthorityType,
} from "#src/types/prior-authority.js";

const paFormRouter = express.Router();

// TODO This can be removed once the app has a landing page
paFormRouter.get("/", getStartPage);

paFormRouter.get("/pa-form/start-page", getStartPage);

paFormRouter.get("/pa-form/type-pa", getPaTypePage);

paFormRouter.post(
  "/pa-form/type-pa",
  validateData(priorAuthorityTypeSchema, "pa-form/type-pa"),
  saveToSession<{ PriorAuthorityType: PriorAuthorityType }, "type">(
    "type",
    (body) => body.PriorAuthorityType,
  ),
  postPriorAuthorityType,
);
paFormRouter.get("/pa-form/expert-details", getExpertDetailsPage);

paFormRouter.post(
  "/pa-form/expert-details",
  validateData(priorAuthorityExpertFullNameSchema, "pa-form/expert-details"),
  saveToSession<{ PriorAuthorityFullName: PriorAuthorityFullName }, "fullName">(
    "fullName",
    (body) => body.PriorAuthorityFullName,
  ),
  postExpertDetails,
);

paFormRouter.get("/pa-form/confirmation-page", getConfirmationPage);

export default paFormRouter;
