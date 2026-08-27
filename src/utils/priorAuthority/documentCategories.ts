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
      text: "Estimate of costs with a breakdown of hours",
      required: true,
    },
    {
      value: "ALTERNATIVE_QUOTES",
      text: "Alternative quotes",
      required: false,
    },
    {
      value: "CERTIFICATE_REFERENCES",
      text: "Certificate references of any other parties",
      required: false,
    },
  ],
  counsel: [
    {
      value: "COUNSEL_ADVICE",
      text: "Written advice from counsel, or a detailed narrative explaining why this level of representation is necessary",
      required: true,
    },
    {
      value: "COURT_ORDER",
      text: "Relevant court orders directing or supporting the representation",
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
