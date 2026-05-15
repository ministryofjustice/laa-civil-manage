import type { Request } from "#node_modules/@types/express";
import type { PriorAuthority } from "#src/types/prior-authority.js";

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
  return (
    typeof body === "object" &&
    body !== null &&
    "_action" in body &&
    body._action === "delete"
  );
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
  const priorAuthority: Partial<PriorAuthority> =
    req.session.priorAuthority ?? {};
  priorAuthority.uploadedDocuments = (
    priorAuthority.uploadedDocuments ?? []
  ).filter((doc) => doc.fileName !== fileName);
  req.session.priorAuthority = priorAuthority;
};
