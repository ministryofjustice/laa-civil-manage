import type { PriorAuthoritySection } from "#src/utils/documentUploadHelpers.js";

export interface DocumentCategory {
  value: string;
  text: string;
  required: boolean;
}

export const DOCUMENT_CATEGORIES: Record<
  PriorAuthoritySection,
  DocumentCategory[]
> = {
  expert: [
    { value: "COURT_ORDER", text: "Court order", required: true },
    {
      value: "LETTER_OF_INSTRUCTION",
      text: "Letter of instruction",
      required: true,
    },
    {
      value: "ESTIMATE_OF_COSTS",
      text: "Estimate of costs",
      required: true,
    },
    {
      value: "ALTERNATIVE_QUOTE",
      text: "Alternative quote",
      required: false,
    },
    {
      value: "OTHER_PARTY_CERTIFICATE_REFERENCE",
      text: "Other party certificate reference",
      required: false,
    },
    {
      value: "OTHER_SUPPORTING_DOCUMENT",
      text: "Other supporting document",
      required: false,
    },
  ],
  disbursement: [
    { value: "PRIMARY_QUOTE", text: "Primary quote", required: true },
    {
      value: "ADDITIONAL_QUOTE",
      text: "Additional quote",
      required: false,
    },
    { value: "COURT_ORDER", text: "Court order", required: false },
    {
      value: "LETTER_OF_INSTRUCTION",
      text: "Letter of instruction",
      required: false,
    },
    {
      value: "OTHER_SUPPORTING_DOCUMENT",
      text: "Other supporting document",
      required: false,
    },
  ],
  counsel: [],
};

export const getDocumentCategories = (
  section: PriorAuthoritySection,
): DocumentCategory[] => DOCUMENT_CATEGORIES[section];

export const getRequiredDocumentCategories = (
  section: PriorAuthoritySection,
): DocumentCategory[] =>
  DOCUMENT_CATEGORIES[section].filter((category) => category.required);

export const getDocumentCategoryText = (
  section: PriorAuthoritySection,
  value: string | undefined,
): string | undefined =>
  DOCUMENT_CATEGORIES[section].find((category) => category.value === value)
    ?.text;
