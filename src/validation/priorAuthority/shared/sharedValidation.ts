import { z } from "zod";
import { getRequiredDocumentCategories } from "#src/utils/priorAuthority/documentCategories.js";
import type { PriorAuthoritySection } from "#src/utils/documentUploadHelpers.js";

const SECTIONS_REQUIRING_CATEGORY_VALIDATION: PriorAuthoritySection[] = [
  "expert",
  "disbursement",
];

export const getUploadedDocumentsSchema = (
  section: PriorAuthoritySection,
): z.ZodType => {
  const requiresCategoryValidation =
    SECTIONS_REQUIRING_CATEGORY_VALIDATION.includes(section);

  const documentsArray = z.array(
    z.object({
      fileName: z.string(),
      originalFileName: z.string(),
      category: z.string().optional(),
    }),
  );

  // Sections requiring categories rely solely on the category check below (an
  // empty upload surfaces the more useful "missing categories" message rather
  // than the generic "upload at least one document" one).
  const documents = requiresCategoryValidation
    ? documentsArray
    : documentsArray.min(1, { error: "Please upload at least one document" });

  return z.object({
    PriorAuthorityDocuments: documents.superRefine((docs, ctx) => {
      if (!requiresCategoryValidation) {
        return;
      }
      const missingCategories = getRequiredDocumentCategories(section).filter(
        (category) => !docs.some((doc) => doc.category === category.value),
      );
      // One issue per category so the error summary lists each on its own line.
      missingCategories.forEach((category) => {
        ctx.addIssue({
          code: "custom",
          message: `You must provide at least one document for the ${category.text} category`,
        });
      });
    }),
  });
};
