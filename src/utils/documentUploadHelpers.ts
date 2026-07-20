import type { Request } from "express";
import type { UploadedDocument } from "#src/types/priorAuthority/shared.js";

export const FILE_SIZE_ERROR = "The selected file must be smaller than 7MB";

export const buildUploadedFilesList = (docs: UploadedDocument[]): object[] =>
  docs.map((doc) => ({
    message: { text: doc.originalFileName },
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

export const deleteFileFromSession = (req: Request, fileName: string): void => {
  const priorAuthority = req.session.priorAuthority ?? {};
  const uploadedDocuments = priorAuthority.uploadedDocuments ?? [];
  req.session.priorAuthority = {
    ...priorAuthority,
    uploadedDocuments: uploadedDocuments.filter(
      (doc) => doc.fileName !== fileName,
    ),
  };
};
