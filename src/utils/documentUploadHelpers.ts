import type { Request } from "express";
import type { UploadedDocument } from "#src/types/priorAuthority/shared.js";
import { getDocumentCategories } from "#src/utils/priorAuthority/documentCategories.js";

export type PriorAuthoritySection = "expert" | "counsel" | "disbursement";

export const FILE_SIZE_ERROR = "The selected file must be smaller than 7MB";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const categoryFieldName = (fileName: string): string =>
  `category-${fileName}`;

// Renders the per-file category picker shown inline alongside an uploaded
// file's name. "Select a category" is the table's bold column header (see
// documentUpload.njk / custom.js header rows), so the label here is
// visually hidden and only announced to screen reader users; the
// "Save category" button is a noscript fallback for when JS is unavailable.
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
