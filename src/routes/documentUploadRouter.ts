import { validateData } from "#src/middleware/validationMiddleware.js";
import type { UploadedDocument } from "#src/types/priorAuthority/shared.js";

import {
  addUploadedDocuments,
  buildFileMessageHtml,
  buildUploadedFilesList,
  deleteFileFromSession,
  FILE_SIZE_ERROR,
  getCategoryFieldValue,
  getDeleteFileName,
  getSetCategoryFileName,
  getUploadedDocuments,
  isCsrfValid,
  isDeleteAction,
  isSetCategoryAction,
  isUploadAction,
  sendDocumentFile,
  updateDocumentCategory,
  type PriorAuthoritySection,
} from "#src/utils/documentUploadHelpers.js";
import { getRequiredDocumentCategories } from "#src/utils/priorAuthority/documentCategories.js";
import { saveToDrafts } from "#src/middleware/priorAuthority/shared/saveToDrafts.js";
import { uploadedDocumentsSchema } from "#src/validation/priorAuthority/shared/sharedValidation.js";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import express from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";

declare module "express" {
  interface Request {
    pendingOriginalName?: string;
  }
}

export interface DocumentUploadRouteConfig {
  section: PriorAuthoritySection;
  basePath: string;
  backLinkHref: string;
  continueRedirect: string;
  introTemplate: string;
}

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

export const createDocumentUploadRouter = (
  config: DocumentUploadRouteConfig,
): express.Router => {
  const { section, basePath, backLinkHref, continueRedirect, introTemplate } =
    config;
  const documentUploadPath = `${basePath}/document-upload`;
  const uploadUrl = `${basePath}/ajax-upload-url`;
  const deleteUrl = `${basePath}/ajax-delete-url`;
  const categoryUrl = `${basePath}/ajax-category-url`;

  const router = express.Router();

  const setDocumentUploadLocals: RequestHandler = (req, res, next): void => {
    res.locals.backLinkHref = backLinkHref;
    res.locals.formAction = documentUploadPath;
    res.locals.uploadUrl = uploadUrl;
    res.locals.deleteUrl = deleteUrl;
    res.locals.categoryUrl = categoryUrl;
    res.locals.introTemplate = introTemplate;
    res.locals.requiredDocumentCategories =
      getRequiredDocumentCategories(section);
    next();
  };

  const uploadFormFilesOrError = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    upload.array("PriorAuthorityDocuments")(req, res, (err: unknown): void => {
      if (isFileSizeError(err)) {
        res.render("priorAuthority/documentUpload", {
          errors: [{ text: FILE_SIZE_ERROR, href: "#PriorAuthorityDocuments" }],
          errorMap: { PriorAuthorityDocuments: FILE_SIZE_ERROR },
          uploadedFiles: buildUploadedFilesList(
            getUploadedDocuments(req, section),
            section,
          ),
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

  const saveUploadedFilesToSession = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!isCsrfValid(req)) {
      next(new Error("Invalid CSRF token"));
    }

    if (isSetCategoryAction(req)) {
      const fileName = getSetCategoryFileName(req);
      if (typeof fileName === "string") {
        updateDocumentCategory(
          req,
          section,
          fileName,
          getCategoryFieldValue(req, fileName),
        );
      }
      res.redirect(documentUploadPath);
      return;
    }

    const files = req.files;
    if (Array.isArray(files) && files.length > 0) {
      const newDocs: UploadedDocument[] = files.map((file) => ({
        fileName: randomUUID(),
        originalFileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        content: file.buffer.toString("base64"),
      }));
      addUploadedDocuments(req, section, newDocs);
    }
    if (isUploadAction(req)) {
      res.redirect(documentUploadPath);
      return;
    }
    if (isDeleteAction(req)) {
      const fileNameToDelete = getDeleteFileName(req);
      if (typeof fileNameToDelete === "string") {
        deleteFileFromSession(req, section, fileNameToDelete);
      }
      res.redirect(documentUploadPath);
      return;
    }
    next();
  };

  const attachUploadedFiles = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    res.locals.uploadedFiles = buildUploadedFilesList(
      getUploadedDocuments(req, section),
      section,
    );
    next();
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

  router.get("/document-upload", setDocumentUploadLocals, (req, res) => {
    res.render("priorAuthority/documentUpload", {
      uploadedFiles: buildUploadedFilesList(
        getUploadedDocuments(req, section),
        section,
      ),
    });
  });

  router.post(
    "/document-upload",
    setDocumentUploadLocals,
    uploadFormFilesOrError,
    saveUploadedFilesToSession,
    attachUploadedFiles,
    saveToDrafts,
    validateData(
      uploadedDocumentsSchema,
      "priorAuthority/documentUpload",
      (req) => ({
        PriorAuthorityDocuments: getUploadedDocuments(req, section),
      }),
    ),
    (req, res) => {
      res.redirect(continueRedirect);
    },
  );

  router.post("/ajax-upload-url", uploadAjaxFileOrError, (req, res) => {
    const file = req.file;
    if (file === undefined) {
      return res.status(400).json({ error: { message: "No file received" } });
    }
    const { originalname, mimetype, size, buffer } = file;
    const fileName = randomUUID();
    const doc: UploadedDocument = {
      fileName,
      originalFileName: originalname,
      mimeType: mimetype,
      size,
      content: buffer.toString("base64"),
    };
    addUploadedDocuments(req, section, [doc]);
    res.json({
      success: {
        messageHtml: buildFileMessageHtml(section, doc),
        messageText: originalname,
      },
      file: { filename: fileName, originalname },
    });
  });

  router.post("/ajax-category-url", (req, res) => {
    const body: unknown = req.body;
    const fileName =
      typeof body === "object" && body !== null && "fileName" in body
        ? (body as Record<string, unknown>).fileName
        : undefined;
    const category =
      typeof body === "object" && body !== null && "category" in body
        ? (body as Record<string, unknown>).category
        : undefined;
    if (typeof fileName === "string") {
      updateDocumentCategory(
        req,
        section,
        fileName,
        typeof category === "string" && category !== "" ? category : undefined,
      );
    }
    res.json({ success: true });
  });

  router.post("/ajax-delete-url", (req, res) => {
    const body: unknown = req.body;
    const fileName =
      typeof body === "object" &&
      body !== null &&
      "delete" in body &&
      typeof (body as Record<string, unknown>).delete === "string"
        ? (body as Record<string, unknown>).delete
        : undefined;
    if (typeof fileName === "string") {
      deleteFileFromSession(req, section, fileName);
    }
    res.json({ success: true });
  });

  router.get("/documents/:fileName/view", (req, res) => {
    sendDocumentFile(req, res, section, req.params.fileName, "view");
  });

  router.get("/documents/:fileName/download", (req, res) => {
    sendDocumentFile(req, res, section, req.params.fileName, "download");
  });

  return router;
};
