import {
  getDocumentUploadPage,
  postUploadedDocuments,
} from "#src/controllers/pa-form.controller.js";
import { validateData } from "#src/middleware/validationMiddleware.js";
import type {
  PriorAuthority,
  UploadedDocument,
} from "#src/types/prior-authority.js";
import {
  buildUploadedFilesList,
  deleteFileFromSession,
  FILE_SIZE_ERROR,
  getDeleteFileName,
  isCsrfValid,
  isDeleteAction,
  isUploadAction,
} from "#src/utils/documentUploadHelpers.js";
import { uploadedDocumentsSchema } from "#src/validation/prior-authority.js";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";

declare module "express" {
  interface Request {
    pendingOriginalName?: string;
  }
}

const documentUploadRouter = express.Router();

const documentUploadPagePath = "/pa-form/document-upload";

export const documentUploadA11yPages = [documentUploadPagePath] as const;

const upload = multer({
  limits: {
    fileSize: 7 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    req.pendingOriginalName = file.originalname;
    cb(null, true);
  },
});

const isFileSizeError = (err: unknown): boolean =>
  err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE";

const uploadFormFilesOrError = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  upload.array("PriorAuthorityDocuments")(req, res, (err: unknown): void => {
    if (isFileSizeError(err)) {
      const storedDocs = req.session.priorAuthority?.uploadedDocuments ?? [];
      res.render("pa-form/document-upload", {
        errors: [{ text: FILE_SIZE_ERROR, href: "#PriorAuthorityDocuments" }],
        errorMap: { PriorAuthorityDocuments: FILE_SIZE_ERROR },
        uploadedFiles: buildUploadedFilesList(storedDocs),
      });
      return;
    }
    if (err instanceof Error) {
      next(err);
      return;
    }
    next();
  });
};

const uploadAjaxFileOrError = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  upload.single("documents")(req, res, (err: unknown): void => {
    if (isFileSizeError(err)) {
      const originalName = req.pendingOriginalName;
      const message =
        originalName !== undefined
          ? `${originalName} must be smaller than 7MB`
          : FILE_SIZE_ERROR;
      res.json({ error: { message } });
      return;
    }
    if (err instanceof Error) {
      next(err);
      return;
    }
    next();
  });
};

const saveUploadedFilesToSession = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!isCsrfValid(req)) {
    next(new Error("Invalid CSRF token"));
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
    res.redirect(documentUploadPagePath);
    return;
  }
  if (isDeleteAction(req)) {
    const fileNameToDelete = getDeleteFileName(req);
    if (typeof fileNameToDelete === "string") {
      deleteFileFromSession(req, fileNameToDelete);
    }
    res.redirect(documentUploadPagePath);
    return;
  }
  next();
};

const attachUploadedFiles = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const storedDocs = req.session.priorAuthority?.uploadedDocuments ?? [];
  res.locals.uploadedFiles = buildUploadedFilesList(storedDocs);
  next();
};

documentUploadRouter.get(documentUploadPagePath, getDocumentUploadPage);

documentUploadRouter.post(
  documentUploadPagePath,
  uploadFormFilesOrError,
  saveUploadedFilesToSession,
  attachUploadedFiles,
  validateData(uploadedDocumentsSchema, "pa-form/document-upload", (req) => ({
    PriorAuthorityDocuments:
      req.session.priorAuthority?.uploadedDocuments ?? [],
  })),
  postUploadedDocuments,
);

documentUploadRouter.post(
  "/ajax-upload-url",
  uploadAjaxFileOrError,
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
        messageHtml: originalname,
        messageText: originalname,
      },
      file: { filename: fileName, originalname },
    });
  },
);

documentUploadRouter.post("/ajax-delete-url", (req, res) => {
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

export default documentUploadRouter;
