import { z } from "zod";

export const uploadedDocumentsSchema = z.object({
  PriorAuthorityDocuments: z
    .array(
      z.object({
        fileName: z.string(),
        originalFileName: z.string(),
      }),
    )
    .min(1, { error: "Please upload at least one document" }),
});
