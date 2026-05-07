import express from "express";

import {
  getConfirmationPage,
  getPaTypePage,
  getSearchAnExpertTypePage,
  getStartPage,
  loadExpertTypesMiddleware,
  postExpertType,
  postPriorAuthorityType,
} from "#src/controllers/pa-form.controller.js";
import { typeOfPriorAuthority } from "#src/validation/type-pa.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import { saveToSession } from "#src/middleware/saveToSession.js";
import type { PriorAuthorityType } from "#src/types/prior-authority.js";
import { expertTypeSchema } from "#src/validation/expert-type.js";

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

paFormRouter.get("/pa-form/confirmation-page", getConfirmationPage);

paFormRouter.use("/pa-form/search-an-expert-type", loadExpertTypesMiddleware);

paFormRouter.get("/pa-form/search-an-expert-type", getSearchAnExpertTypePage);

paFormRouter.post(
  "/pa-form/search-an-expert-type",
  validateData(expertTypeSchema, "pa-form/search-an-expert-type"),
  saveToSession<{ "expert-list": string }, "expertType">(
    "expertType",
    (body) => body["expert-list"],
  ),
  postExpertType,
);

export default paFormRouter;
