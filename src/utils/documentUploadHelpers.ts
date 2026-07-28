import type { Request } from "express";
import type { UploadedDocument } from "#src/types/priorAuthority/shared.js";

export type PriorAuthoritySection = "expert" | "counsel";

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

export const getUploadedDocuments = (
  req: Request,
  section: PriorAuthoritySection,
): UploadedDocument[] => {
  req.session.priorAuthority ??= { expert: {}, counsel: {} };
  return req.session.priorAuthority[section].uploadedDocuments ?? [];
};

export const addUploadedDocuments = (
  req: Request,
  section: PriorAuthoritySection,
  newDocs: UploadedDocument[],
): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {} };
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
  req.session.priorAuthority ??= { expert: {}, counsel: {} };
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
