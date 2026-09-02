import type { Request, Response } from "express";
import type { UploadedDocument } from "#src/types/priorAuthority/shared.js";
import { getDocumentCategories } from "#src/utils/priorAuthority/documentCategories.js";

export type PriorAuthoritySection = "expert" | "counsel" | "disbursement";

export const FILE_SIZE_ERROR = "The selected file must be 10MB or smaller";
const PDF_MIME_TYPE = "application/pdf";
const BYTES_PER_KILOBYTE = 1024;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const categoryFieldName = (fileName: string): string =>
  `category-${fileName}`;

export const buildCategorySelectHtml = (
  section: PriorAuthoritySection,
  doc: UploadedDocument,
): string => {
  const categories = getDocumentCategories(section);
  if (categories.length === 0) {
    return "";
  }
  const options = [{ value: "", text: "Choose a category" }, ...categories]
    .map(
      (option) =>
        `<option value="${escapeHtml(option.value)}"${
          option.value === (doc.category ?? "") ? " selected" : ""
        }>${escapeHtml(option.text)}</option>`,
    )
    .join("");
  const fieldName = categoryFieldName(doc.fileName);
  return (
    `<span class="pa-document-category-cell">` +
    `<label class="govuk-visually-hidden" for="${fieldName}">Document category for ${escapeHtml(doc.originalFileName)}</label>` +
    `<select class="govuk-select govuk-!-margin-bottom-0 pa-document-category-select" id="${fieldName}" name="${fieldName}" data-file-name="${doc.fileName}">${options}</select>` +
    `<noscript><button type="submit" class="govuk-button govuk-button--secondary govuk-!-margin-top-2 govuk-!-margin-bottom-0" name="setCategory" value="${doc.fileName}">Save</button></noscript>` +
    `</span>`
  );
};

export const buildFileMessageHtml = (
  section: PriorAuthoritySection,
  doc: UploadedDocument,
): string =>
  `<span class="moj-multi-file-upload__filename">${escapeHtml(doc.originalFileName)}</span>${buildCategorySelectHtml(section, doc)}`;

export const buildUploadedFilesList = (
  docs: UploadedDocument[],
  section: PriorAuthoritySection,
): object[] =>
  docs.map((doc) => ({
    message: {
      text: doc.originalFileName,
      html: buildFileMessageHtml(section, doc),
    },
    fileName: doc.fileName,
    originalFileName: doc.originalFileName,
    deleteButton: { text: "Delete" },
  }));

export const isCsrfValid = (req: Request): boolean => {
  const body: unknown = req.body;
  if (typeof body !== "object" || body === null || !("_csrf" in body)) {
    return false;
  }
  return typeof body._csrf === "string" && body._csrf === req.session.csrfToken;
};

export const isUploadAction = (req: Request): boolean => {
  const body: unknown = req.body;
  return (
    typeof body === "object" &&
    body !== null &&
    "_action" in body &&
    body._action === "upload"
  );
};

export const isDeleteAction = (req: Request): boolean => {
  const body: unknown = req.body;
  return typeof body === "object" && body !== null && "delete" in body;
};

export const getDeleteFileName = (req: Request): string | undefined => {
  const body: unknown = req.body;
  const value =
    typeof body === "object" && body !== null && "delete" in body
      ? (body as Record<string, unknown>).delete
      : undefined;
  return typeof value === "string" ? value : undefined;
};

export const isSetCategoryAction = (req: Request): boolean => {
  const body: unknown = req.body;
  return typeof body === "object" && body !== null && "setCategory" in body;
};

export const getSetCategoryFileName = (req: Request): string | undefined => {
  const body: unknown = req.body;
  const value =
    typeof body === "object" && body !== null && "setCategory" in body
      ? (body as Record<string, unknown>).setCategory
      : undefined;
  return typeof value === "string" ? value : undefined;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const getCategoryFieldValue = (
  req: Request,
  fileName: string,
): string | undefined => {
  const body: unknown = req.body;
  if (!isRecord(body)) {
    return undefined;
  }
  const value = body[categoryFieldName(fileName)];
  return typeof value === "string" && value !== "" ? value : undefined;
};

export const getFileExtension = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf(".");
  return lastDotIndex === -1
    ? ""
    : fileName.slice(lastDotIndex + 1).toLowerCase();
};

export const formatFileSize = (bytes: number | undefined): string => {
  if (bytes === undefined) {
    return "";
  }
  return `${Math.max(1, Math.round(bytes / BYTES_PER_KILOBYTE))}KB`;
};

export const buildSupportingDocumentsRows = (
  documents: UploadedDocument[] | undefined,
  basePath: string,
): Array<{ key: { text: string }; value: { html: string } }> =>
  (documents ?? []).map((doc) => {
    const extension = getFileExtension(doc.originalFileName);
    const sizeLabel = formatFileSize(doc.size);
    const downloadHref = `${basePath}/documents/${doc.fileName}/download`;
    const viewLink =
      doc.mimeType === PDF_MIME_TYPE
        ? `<a class="govuk-link govuk-link--no-visited-state govuk-!-font-weight-bold" href="${basePath}/documents/${doc.fileName}/view">View</a> | `
        : "";
    return {
      key: { text: doc.originalFileName },
      value: {
        html: `${viewLink}<a class="govuk-link govuk-link--no-visited-state" href="${downloadHref}">Download (${escapeHtml(extension)} ${escapeHtml(sizeLabel)})</a>`,
      },
    };
  });

// a stand-in until the real backend supports document storage/retrieval.
export const sendDocumentFile = (
  req: Request,
  res: Response,
  section: PriorAuthoritySection,
  fileName: string,
  mode: "view" | "download",
): void => {
  const doc = getUploadedDocuments(req, section).find(
    (candidate) => candidate.fileName === fileName,
  );
  if (doc?.content === undefined) {
    res.sendStatus(404);
    return;
  }
  if (mode === "view" && doc.mimeType !== PDF_MIME_TYPE) {
    res.sendStatus(400);
    return;
  }
  const safeFileName = doc.originalFileName.replace(/"/g, "");
  res.setHeader("Content-Type", doc.mimeType ?? "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    `${mode === "view" ? "inline" : "attachment"}; filename="${encodeURIComponent(safeFileName)}"`,
  );
  res.send(Buffer.from(doc.content, "base64"));
};

export const getUploadedDocuments = (
  req: Request,
  section: PriorAuthoritySection,
): UploadedDocument[] => {
  req.session.priorAuthority ??= { expert: {}, counsel: {}, disbursement: {} };
  return req.session.priorAuthority[section].uploadedDocuments ?? [];
};

export const addUploadedDocuments = (
  req: Request,
  section: PriorAuthoritySection,
  newDocs: UploadedDocument[],
): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {}, disbursement: {} };
  const priorAuthority = req.session.priorAuthority;
  req.session.priorAuthority = {
    ...priorAuthority,
    [section]: {
      ...priorAuthority[section],
      uploadedDocuments: [
        ...(priorAuthority[section].uploadedDocuments ?? []),
        ...newDocs,
      ],
    },
  };
};

export const deleteFileFromSession = (
  req: Request,
  section: PriorAuthoritySection,
  fileName: string,
): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {}, disbursement: {} };
  const priorAuthority = req.session.priorAuthority;
  const uploadedDocuments = priorAuthority[section].uploadedDocuments ?? [];
  req.session.priorAuthority = {
    ...priorAuthority,
    [section]: {
      ...priorAuthority[section],
      uploadedDocuments: uploadedDocuments.filter(
        (doc) => doc.fileName !== fileName,
      ),
    },
  };
};

export const updateDocumentCategory = (
  req: Request,
  section: PriorAuthoritySection,
  fileName: string,
  category: string | undefined,
): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {}, disbursement: {} };
  const priorAuthority = req.session.priorAuthority;
  const uploadedDocuments = priorAuthority[section].uploadedDocuments ?? [];
  req.session.priorAuthority = {
    ...priorAuthority,
    [section]: {
      ...priorAuthority[section],
      uploadedDocuments: uploadedDocuments.map((doc) =>
        doc.fileName === fileName ? { ...doc, category } : doc,
      ),
    },
  };
};
