import { getUploadedDocumentsSchema } from "#src/validation/priorAuthority/shared/sharedValidation.js";
import { describe, test, expect } from "bun:test";

describe("getUploadedDocumentsSchema", () => {
  test("fails when no documents are uploaded", () => {
    const result = getUploadedDocumentsSchema("disbursement").safeParse({
      PriorAuthorityDocuments: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Please upload at least one document",
      );
    }
  });

  test("fails when a required category has no matching document", () => {
    const result = getUploadedDocumentsSchema("disbursement").safeParse({
      PriorAuthorityDocuments: [
        {
          fileName: "abc",
          originalFileName: "quote.pdf",
          category: "ADDITIONAL_QUOTE",
        },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "You must provide at least one document for each of the following categories: Primary quote",
      );
    }
  });

  test("passes when the required category has a matching document", () => {
    const result = getUploadedDocumentsSchema("disbursement").safeParse({
      PriorAuthorityDocuments: [
        {
          fileName: "abc",
          originalFileName: "quote.pdf",
          category: "PRIMARY_QUOTE",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  test("does not enforce required categories for sections other than expert/disbursement", () => {
    const result = getUploadedDocumentsSchema("counsel").safeParse({
      PriorAuthorityDocuments: [
        {
          fileName: "abc",
          originalFileName: "advice.pdf",
          category: undefined,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  test("fails when the expert section is missing required categories", () => {
    const result = getUploadedDocumentsSchema("expert").safeParse({
      PriorAuthorityDocuments: [
        {
          fileName: "abc",
          originalFileName: "court-order.pdf",
          category: "COURT_ORDER",
        },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "You must provide at least one document for each of the following categories: Letter of instruction, Estimate of costs",
      );
    }
  });

  test("passes when the expert section has all required categories", () => {
    const result = getUploadedDocumentsSchema("expert").safeParse({
      PriorAuthorityDocuments: [
        {
          fileName: "a",
          originalFileName: "court-order.pdf",
          category: "COURT_ORDER",
        },
        {
          fileName: "b",
          originalFileName: "loi.pdf",
          category: "LETTER_OF_INSTRUCTION",
        },
        {
          fileName: "c",
          originalFileName: "estimate.pdf",
          category: "ESTIMATE_OF_COSTS",
        },
      ],
    });

    expect(result.success).toBe(true);
  });
});
