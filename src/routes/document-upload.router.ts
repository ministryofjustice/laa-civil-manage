import {
  getDocumentUploadPage,
  postUploadedDocuments,
} from "#src/controllers/pa-form.controller.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import type {
  PriorAuthority,
  UploadedDocument,
} from "#src/types/prior-authority.js";
import { uploadedDocuments } from "#src/validation/type-pa.js";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";

const docuementUploadRouter = express.Router();

const upload = multer();

const isCsrfValid = (req: Request): boolean => {
  const body: unknown = req.body;
  if (typeof body !== "object" || body === null || !("_csrf" in body)) {
    return false;
  }
  return typeof body._csrf === "string" && body._csrf === req.session.csrfToken;
};

const isUploadAction = (req: Request): boolean => {
  const body: unknown = req.body;
  return (
    typeof body === "object" &&
    body !== null &&
    "_action" in body &&
    body._action === "upload"
  );
};

const saveUploadedFilesToSession = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!isCsrfValid(req)) {
    res.status(403).render("errors/500");
    return;
  }

  const files = req.files;
  if (Array.isArray(files) && files.length > 0) {
    const priorAuthority: Partial<PriorAuthority> =
      req.session.priorAuthority ?? {};
    const newDocs: UploadedDocument[] = files.map((file) => ({
      fileName: randomUUID(),
      originalFileName: file.originalname,
    }));
    priorAuthority.uploadedDocuments = [
      ...(priorAuthority.uploadedDocuments ?? []),
      ...newDocs,
    ];
    req.session.priorAuthority = priorAuthority;
  }
  if (isUploadAction(req)) {
    res.redirect("/pa-form/document-upload");
    return;
  }
  next();
};

docuementUploadRouter.get("/pa-form/document-upload", getDocumentUploadPage);

docuementUploadRouter.post(
  "/pa-form/document-upload",
  upload.array("PriorAuthorityDocuments"),
  saveUploadedFilesToSession,
  validateData(uploadedDocuments, "pa-form/document-upload", (req) => ({
    PriorAuthorityDocuments:
      req.session.priorAuthority?.uploadedDocuments ?? [],
  })),
  postUploadedDocuments,
);

docuementUploadRouter.post(
  "/ajax-upload-url",
  upload.single("documents"),
  (req, res) => {
    const file = req.file;
    if (file === undefined) {
      return res.status(400).json({ error: { message: "No file received" } });
    }
    const { originalname } = file;
    const fileName = randomUUID();
    const doc: UploadedDocument = { fileName, originalFileName: originalname };
    const priorAuthority: Partial<PriorAuthority> =
      req.session.priorAuthority ?? {};
    priorAuthority.uploadedDocuments = [
      ...(priorAuthority.uploadedDocuments ?? []),
      doc,
    ];
    req.session.priorAuthority = priorAuthority;
    res.json({
      success: {
        messageHtml: `<strong>${originalname}</strong> has been uploaded`,
        messageText: `${originalname} has been uploaded`,
      },
      file: { filename: fileName, originalname },
    });
  },
);

docuementUploadRouter.post("/ajax-delete-url", (req, res) => {
  const body: unknown = req.body;
  const fileName =
    typeof body === "object" &&
    body !== null &&
    "delete" in body &&
    typeof (body as Record<string, unknown>).delete === "string"
      ? (body as Record<string, unknown>).delete
      : undefined;
  const priorAuthority: Partial<PriorAuthority> =
    req.session.priorAuthority ?? {};
  const existing = priorAuthority.uploadedDocuments ?? [];
  if (typeof fileName === "string") {
    priorAuthority.uploadedDocuments = existing.filter(
      (doc) => doc.fileName !== fileName,
    );
    req.session.priorAuthority = priorAuthority;
  }
  res.json({ success: true });
});

export default docuementUploadRouter;
