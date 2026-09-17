import type { Request } from "express";
import type { UploadedDocument } from "#src/types/priorAuthority/shared.js";
import { isAxiosErrResponse } from "#src/utils/errors.js";
import { getDocumentCategories } from "#src/utils/priorAuthority/documentCategories.js";

export type PriorAuthoritySection = "expert" | "counsel" | "disbursement";

const DEFAULT_FILE_SUBJECT = "The selected file";

const fileSubject = (fileName?: string): string =>
  fileName !== undefined && fileName.trim() !== ""
    ? fileName
    : DEFAULT_FILE_SUBJECT;

export const fileSizeError = (fileName?: string): string =>
  `${fileSubject(fileName)} must be 10MB or smaller`;
export const fileInvalidError = (fileName?: string): string =>
  `${fileSubject(fileName)} must be a valid PDF`;
export const fileRejectedError = (fileName?: string): string =>
  `${fileSubject(fileName)} could not be uploaded. Check the file and try again`;
export const uploadUnavailableError = (fileName?: string): string =>
  `${fileSubject(fileName)} could not be uploaded because of a temporary problem. Try again`;

export const FILE_SIZE_ERROR = fileSizeError();
export const FILE_INVALID_ERROR = fileInvalidError();
export const FILE_REJECTED_ERROR = fileRejectedError();
export const UPLOAD_UNAVAILABLE_ERROR = uploadUnavailableError();

export type UploadFailure =
  | { kind: "recoverable"; message: string }
  | { kind: "notFound" }
  | { kind: "unexpected" };

const getResponseStatus = (error: unknown): number | undefined => {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return undefined;
  }
  const { response } = error;
  return isAxiosErrResponse(response) ? response.status : undefined;
};

export const classifyUploadError = (
  error: unknown,
  fileName?: string,
): UploadFailure => {
  const status = getResponseStatus(error);

  switch (status) {
    case 400:
    case 409:
      return { kind: "recoverable", message: fileRejectedError(fileName) };
    case 404:
      return { kind: "notFound" };
    case 413:
      return { kind: "recoverable", message: fileSizeError(fileName) };
    case 415:
      return { kind: "recoverable", message: fileInvalidError(fileName) };
    default:
      break;
  }

  if (status !== undefined && status >= 500) {
    return { kind: "recoverable", message: uploadUnavailableError(fileName) };
  }

  return { kind: "unexpected" };
};

const BYTES_PER_KILOBYTE = 1024;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/gv, "&amp;")
    .replace(/</gv, "&lt;")
    .replace(/>/gv, "&gt;")
    .replace(/"/gv, "&quot;")
    .replace(/'/gv, "&#39;");

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
  _basePath: string,
): Array<{ key: { text: string }; value: { text: string } }> =>
  (documents ?? []).map((doc) => ({
    key: { text: doc.originalFileName },
    value: {
      text: "Uploaded",
    },
  }));
