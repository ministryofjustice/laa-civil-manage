import { z } from "zod";
import { getRequiredDocumentCategories } from "#src/utils/priorAuthority/documentCategories.js";
import type { PriorAuthoritySection } from "#src/utils/documentUploadHelpers.js";

const SECTIONS_REQUIRING_CATEGORY_VALIDATION: PriorAuthoritySection[] = [
  "expert",
  "disbursement",
];

export const getUploadedDocumentsSchema = (
  section: PriorAuthoritySection,
): z.ZodType =>
  z.object({
    PriorAuthorityDocuments: z
      .array(
        z.object({
          fileName: z.string(),
          originalFileName: z.string(),
          category: z.string().optional(),
        }),
      )
      .min(1, { error: "Please upload at least one document" })
      .superRefine((docs, ctx) => {
        if (!SECTIONS_REQUIRING_CATEGORY_VALIDATION.includes(section)) {
          return;
        }
        const missingCategories = getRequiredDocumentCategories(section).filter(
          (category) => !docs.some((doc) => doc.category === category.value),
        );
        if (missingCategories.length > 0) {
          ctx.addIssue({
            code: "custom",
            message: `You must provide at least one document for each of the following categories: ${missingCategories
              .map((category) => category.text)
              .join(", ")}`,
          });
        }
      }),
  });
