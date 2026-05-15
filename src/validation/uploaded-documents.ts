import { z } from "zod";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/rtf",
  "application/vnd.oasis.opendocument.text",
  "image/jpeg",
  "image/bmp",
  "image/png",
  "image/tiff",
] as const;

export const FILE_TYPE_ERROR =
  "The selected file must be a DOC, DOCX, RTF, ODT, JPG, BMP, PNG, TIF or PDF";

export const uploadedFile = z.object({
  mimetype: z
    .string()
    .refine(
      (mime): boolean =>
        (ALLOWED_MIME_TYPES as readonly string[]).includes(mime),
      { message: FILE_TYPE_ERROR },
    ),
});

export const uploadedDocuments = z.object({
  PriorAuthorityDocuments: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === "") return [];
      if (typeof val === "string") return [val];
      return val;
    },
    z
      .array(z.string().min(1))
      .min(1, { message: "Please upload at least one document" }),
  ),
});
