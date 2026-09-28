import {
  deletePriorAuthorityDocument,
  updatePriorAuthorityDocumentType,
  uploadPriorAuthorityDocument,
} from "#src/models/priorAuthorityDocuments.models.js";
import {
  buildFileMessageHtml,
  classifyUploadError,
  fileSizeError,
  getDeleteFileName,
  type PriorAuthoritySection,
} from "#src/utils/documentUploadHelpers.js";
import { logger } from "#src/utils/logger.js";
import { validatePdfUpload } from "#src/validation/priorAuthority/shared/fileUploadValidation.js";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import multer from "multer";

interface DocumentUploadAjaxRouterConfig {
  section: PriorAuthoritySection;
  pdfOnly: boolean;
  getPriorAuthorityId: (req: Request) => string;
  handleDeleteFailure: (
    req: Request,
    res: Response,
    next: NextFunction,
    error: unknown,
    ajax?: boolean,
  ) => void;
}

declare module "express" {
  interface Request {
    pendingOriginalName?: string;
  }
}

const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    req.pendingOriginalName = file.originalname;
    cb(null, true);
  },
});

const isFileSizeError = (err: unknown): boolean =>
  err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE";

export const createDocumentUploadAjaxRouter = ({
  section,
  pdfOnly,
  getPriorAuthorityId,
  handleDeleteFailure,
}: DocumentUploadAjaxRouterConfig): express.Router => {
  const router = express.Router();

  const uploadAjaxFileOrError = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    upload.single("documents")(req, res, (err: unknown): void => {
      if (isFileSizeError(err)) {
        res.json({
          error: { message: fileSizeError(req.pendingOriginalName) },
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

  const uploadAjaxDocument = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const file = req.file;
    if (file === undefined) {
      res.status(400).json({ error: { message: "No file received" } });
      return;
    }
    let originalname = file.originalname;
    if (pdfOnly) {
      const validationResult = validatePdfUpload(file);
      if (!validationResult.valid) {
        res.json({ error: { message: validationResult.message } });
        return;
      }
      originalname = validationResult.sanitizedFileName;
    }
    try {
      const uploadedDocument = await uploadPriorAuthorityDocument(
        getPriorAuthorityId(req),
        { ...file, originalname },
      );
      const doc = {
        documentId: uploadedDocument.documentId,
        fileName: uploadedDocument.documentId,
        originalFileName: uploadedDocument.fileName,
        category: uploadedDocument.documentType ?? undefined,
        mimeType: uploadedDocument.mediaType,
        size: uploadedDocument.size,
      };
      res.json({
        success: {
          messageHtml: buildFileMessageHtml(section, doc),
          messageText: originalname,
        },
        file: { filename: doc.fileName, originalname },
      });
    } catch (error) {
      const failure = classifyUploadError(error, originalname);
      if (failure.kind !== "recoverable") {
        throw error;
      }
      logger.logError("documentUpload", "Document upload failed", error, req);
      res.json({ error: { message: failure.message } });
    }
  };

  router.post("/ajax-upload-url", uploadAjaxFileOrError, (req, res, next) => {
    uploadAjaxDocument(req, res).catch(next);
  });

  router.post("/ajax-delete-url", (req, res, next) => {
    const documentId = getDeleteFileName(req);
    if (documentId === undefined || documentId === "") {
      res.status(400).json({ error: { message: "A document is required" } });
      return;
    }
    deletePriorAuthorityDocument(getPriorAuthorityId(req), documentId)
      .then(() => res.json({ success: true }))
      .catch((error: unknown) => {
        handleDeleteFailure(req, res, next, error, true);
      });
  });

  router.post("/ajax-category-url", async (req, res, next) => {
    const categoryUpdate = getCategoryUpdate(req.body);
    if (categoryUpdate === undefined || categoryUpdate.category === "") {
      res
        .status(400)
        .json({ error: { message: "A document category is required" } });
      return;
    }
    try {
      await updatePriorAuthorityDocumentType(
        getPriorAuthorityId(req),
        categoryUpdate.fileName,
        categoryUpdate.category,
      );
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
};

const getCategoryUpdate = (
  body: unknown,
): { fileName: string; category: string } | undefined => {
  if (
    typeof body !== "object" ||
    body === null ||
    !("fileName" in body) ||
    !("category" in body) ||
    typeof body.fileName !== "string" ||
    typeof body.category !== "string"
  ) {
    return undefined;
  }
  return { fileName: body.fileName, category: body.category };
};
