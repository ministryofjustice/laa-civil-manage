import express from "express";

import {
  getConfirmationPage,
  getExpertDetailsPage,
  getPaTypePage,
  getSearchAnExpertTypePage,
  getStartPage,
  postExpertType,
  postExpertDetails,
  postPriorAuthorityType,
  getDocumentUploadPage,
  postUploadedDocuments,
} from "#src/controllers/pa-form.controller.js";
import {
  fullNameOfExpert,
  typeOfPriorAuthority,
} from "#src/validation/type-pa.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import { saveToSession } from "#src/middleware/saveToSession.js";
import type {
  PriorAuthorityDocuments,
  PriorAuthorityExpertFullName,
  PriorAuthorityExpertType,
  PriorAuthorityType,
} from "#src/types/prior-authority.js";
import { typeOfExpert } from "#src/validation/expert-type.js";
import { loadExpertTypesMiddleware } from "#src/middleware/loadExpertTypes.js";
import { uploadedDocuments } from "#src/validation/uploaded-documents.js";

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

paFormRouter.use("/pa-form/search-an-expert-type", loadExpertTypesMiddleware);

paFormRouter.get("/pa-form/search-an-expert-type", getSearchAnExpertTypePage);

paFormRouter.post(
  "/pa-form/search-an-expert-type",
  validateData(typeOfExpert, "pa-form/search-an-expert-type"),
  saveToSession<
    { PriorAuthorityExpertType: PriorAuthorityExpertType },
    "expertType"
  >("expertType", (body) => body.PriorAuthorityExpertType),
  postExpertType,
);

paFormRouter.get("/pa-form/document-upload", getDocumentUploadPage);

paFormRouter.post(
  "/pa-form/document-upload",
  validateData(uploadedDocuments, "pa-form/document-upload"),
  saveToSession<
    { PriorAuthorityDocuments: PriorAuthorityDocuments },
    "uploadedDocuments"
  >("uploadedDocuments", (body) => body.PriorAuthorityDocuments),
  postUploadedDocuments,
);

export default paFormRouter;
