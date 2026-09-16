import { validateData } from "#src/middleware/validationMiddleware.js";
import {
  updatePriorAuthorityDocumentType,
  uploadPriorAuthorityDocument,
} from "#src/models/priorAuthorityDocuments.models.js";
import type { UploadedDocument } from "#src/types/priorAuthority/shared.js";

import {
  buildFileMessageHtml,
  buildUploadedFilesList,
  FILE_SIZE_ERROR,
  getCategoryFieldValue,
  getSetCategoryFileName,
  isCsrfValid,
  isSetCategoryAction,
  isUploadAction,
  type PriorAuthoritySection,
} from "#src/utils/documentUploadHelpers.js";
import { validatePdfUpload } from "#src/validation/priorAuthority/shared/fileUploadValidation.js";
import { getUploadedDocumentsSchema } from "#src/validation/priorAuthority/shared/sharedValidation.js";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import express from "express";
import multer from "multer";

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
  pdfOnly?: boolean;
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

export const createDocumentUploadRouter = (
  config: DocumentUploadRouteConfig,
): express.Router => {
  const {
    section,
    basePath,
    backLinkHref,
    continueRedirect,
    introTemplate,
    pdfOnly = false,
  } = config;
  const documentUploadPath = `${basePath}/document-upload`;
  const uploadUrl = `${basePath}/ajax-upload-url`;
  const categoryUrl = `${basePath}/ajax-category-url`;

  const router = express.Router();

  const isUploadedDocument = (value: unknown): value is UploadedDocument =>
    typeof value === "object" &&
    value !== null &&
    "fileName" in value &&
    "originalFileName" in value &&
    typeof value.fileName === "string" &&
    typeof value.originalFileName === "string";

  const getUploadedDocuments = (req: unknown): UploadedDocument[] => {
    if (
      typeof req !== "object" ||
      req === null ||
      !("priorAuthority" in req) ||
      typeof req.priorAuthority !== "object" ||
      req.priorAuthority === null ||
      !("uploadedDocuments" in req.priorAuthority) ||
      !Array.isArray(req.priorAuthority.uploadedDocuments)
    ) {
      return [];
    }
    return req.priorAuthority.uploadedDocuments.filter(isUploadedDocument);
  };

  const getPriorAuthorityId = (req: Request): string => {
    const { priorAuthorityId } = req.session;
    if (priorAuthorityId === undefined) {
      throw new Error(
        "Cannot upload document: no prior authority draft loaded",
      );
    }
    return priorAuthorityId;
  };

  const toUploadedDocument = (document: {
    documentId: string;
    documentType: string | null;
    fileName: string;
    mediaType: string;
    size: number;
  }): UploadedDocument => ({
    documentId: document.documentId,
    fileName: document.documentId,
    originalFileName: document.fileName,
    category: document.documentType ?? undefined,
    mimeType: document.mediaType,
    size: document.size,
  });

  const renderUploadError = (res: Response, message: string): void => {
    res.render("priorAuthority/documentUpload", {
      errors: [{ text: message, href: "#PriorAuthorityDocuments" }],
      errorMap: { PriorAuthorityDocuments: message },
      uploadedFiles: buildUploadedFilesList(
        getUploadedDocuments(res.req),
        section,
      ),
    });
  };

  const setDocumentUploadLocals: RequestHandler = (req, res, next): void => {
    res.locals.backLinkHref = backLinkHref;
    res.locals.formAction = documentUploadPath;
    res.locals.uploadUrl = uploadUrl;
    res.locals.categoryUrl = categoryUrl;
    res.locals.introTemplate = introTemplate;
    next();
  };

  const uploadFormFilesOrError = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    upload.array("PriorAuthorityDocuments")(req, res, (err: unknown): void => {
      if (isFileSizeError(err)) {
        renderUploadError(res, FILE_SIZE_ERROR);
        return;
      }
      if (err instanceof Error) {
        next(err);
        return;
      }
      next();
    });
  };

  const validateFormFilesOrError = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const files = req.files;
    if (!Array.isArray(files)) {
      next();
      return;
    }

    for (const file of files) {
      if (!pdfOnly) {
        continue;
      }
      const result = validatePdfUpload(file);
      if (!result.valid) {
        renderUploadError(res, result.message);
        return;
      }
      file.originalname = result.sanitizedFileName;
    }
    next();
  };

  const processDocumentUpload = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (!isCsrfValid(req)) {
      next(new Error("Invalid CSRF token"));
      return;
    }

    if (isSetCategoryAction(req)) {
      const fileName = getSetCategoryFileName(req);
      if (typeof fileName === "string") {
        const category = getCategoryFieldValue(req, fileName);
        if (category !== undefined) {
          await updatePriorAuthorityDocumentType(
            getPriorAuthorityId(req),
            fileName,
            category,
          );
        }
      }
      res.redirect(documentUploadPath);
      return;
    }

    const files = req.files;
    if (Array.isArray(files) && files.length > 0) {
      await Promise.all(
        files.map(
          async (file) =>
            await uploadPriorAuthorityDocument(getPriorAuthorityId(req), file),
        ),
      );
    }
    if (isUploadAction(req)) {
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
      getUploadedDocuments(req),
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
            ? `${originalName} must be 10MB or smaller`
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
      uploadedFiles: buildUploadedFilesList(getUploadedDocuments(req), section),
    });
  });

  router.post(
    "/document-upload",
    setDocumentUploadLocals,
    uploadFormFilesOrError,
    validateFormFilesOrError,
    processDocumentUpload,
    attachUploadedFiles,
    validateData(
      getUploadedDocumentsSchema(section),
      "priorAuthority/documentUpload",
      (req) => ({
        PriorAuthorityDocuments: getUploadedDocuments(req),
      }),
    ),
    (req, res) => {
      res.redirect(continueRedirect);
    },
  );

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
    const uploadedDocument = await uploadPriorAuthorityDocument(
      getPriorAuthorityId(req),
      { ...file, originalname },
    );
    const doc = toUploadedDocument(uploadedDocument);
    res.json({
      success: {
        messageHtml: buildFileMessageHtml(section, doc),
        messageText: originalname,
      },
      file: { filename: doc.fileName, originalname },
    });
  };

  router.post("/ajax-upload-url", uploadAjaxFileOrError, (req, res, next) => {
    uploadAjaxDocument(req, res).catch(next);
  });

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
