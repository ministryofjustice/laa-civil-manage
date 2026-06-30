import { z } from "zod";

export const priorAuthorityTypeSchema = z.enum(
  ["Expert", "Disbursement", "Counsel"],
  {
    error: "Select the type of prior authority",
  },
);

export const typeOfPriorAuthoritySchema = z.object({
  PriorAuthorityType: priorAuthorityTypeSchema,
});

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
