import {
  disbursementDetailsSchema,
  disbursementJustificationSchema,
} from "#src/validation/priorAuthority/disbursement/disbursementValidation.js";
import { describe, test, expect } from "bun:test";

describe("disbursementDetailsSchema", () => {
  test("passes validation when a valid description and amount are provided", () => {
    const result = disbursementDetailsSchema.safeParse({
      PriorAuthorityDisbursementPurpose: "Medical records request",
      PriorAuthorityDisbursementAmount: "150.50",
    });

    expect(result.success).toBe(true);
  });

  test("fails when the description is missing", () => {
    const result = disbursementDetailsSchema.safeParse({
      PriorAuthorityDisbursementPurpose: "",
      PriorAuthorityDisbursementAmount: "150.50",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes("PriorAuthorityDisbursementPurpose"),
      );
      expect(issue?.message).toBe("Enter a description of the expense.");
    }
  });

  test("fails when the description is only whitespace", () => {
    const result = disbursementDetailsSchema.safeParse({
      PriorAuthorityDisbursementPurpose: "   ",
      PriorAuthorityDisbursementAmount: "150.50",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes("PriorAuthorityDisbursementPurpose"),
      );
      expect(issue?.message).toBe("Enter a description of the expense.");
    }
  });

  test("passes when the description is exactly 100 characters", () => {
    const result = disbursementDetailsSchema.safeParse({
      PriorAuthorityDisbursementPurpose: "a".repeat(100),
      PriorAuthorityDisbursementAmount: "150.50",
    });

    expect(result.success).toBe(true);
  });

  test("fails when the description exceeds 100 characters", () => {
    const result = disbursementDetailsSchema.safeParse({
      PriorAuthorityDisbursementPurpose: "a".repeat(101),
      PriorAuthorityDisbursementAmount: "150.50",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes("PriorAuthorityDisbursementPurpose"),
      );
      expect(issue?.message).toBe(
        "Expense description must be 100 characters or fewer.",
      );
    }
  });

  test("fails when the amount is missing", () => {
    const result = disbursementDetailsSchema.safeParse({
      PriorAuthorityDisbursementPurpose: "Medical records request",
      PriorAuthorityDisbursementAmount: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes("PriorAuthorityDisbursementAmount"),
      );
      expect(issue?.message).toBe("Enter the amount of the expense.");
    }
  });

  test("fails when the amount contains non-numeric characters", () => {
    const result = disbursementDetailsSchema.safeParse({
      PriorAuthorityDisbursementPurpose: "Medical records request",
      PriorAuthorityDisbursementAmount: "abc",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes("PriorAuthorityDisbursementAmount"),
      );
      expect(issue?.message).toBe("Enter a valid expense amount.");
    }
  });

  test("fails when the amount is zero", () => {
    const result = disbursementDetailsSchema.safeParse({
      PriorAuthorityDisbursementPurpose: "Medical records request",
      PriorAuthorityDisbursementAmount: "0",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes("PriorAuthorityDisbursementAmount"),
      );
      expect(issue?.message).toBe("Expense amount must be greater than £0.");
    }
  });

  test("fails when the amount is negative", () => {
    const result = disbursementDetailsSchema.safeParse({
      PriorAuthorityDisbursementPurpose: "Medical records request",
      PriorAuthorityDisbursementAmount: "-10",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes("PriorAuthorityDisbursementAmount"),
      );
      expect(issue?.message).toBe("Expense amount cannot be negative.");
    }
  });

  test("passes when the amount has no decimal places", () => {
    const result = disbursementDetailsSchema.safeParse({
      PriorAuthorityDisbursementPurpose: "Medical records request",
      PriorAuthorityDisbursementAmount: "100",
    });

    expect(result.success).toBe(true);
  });
});

describe("disbursementJustificationSchema", () => {
  test("passes when a valid justification is provided", () => {
    const result = disbursementJustificationSchema.safeParse({
      justification: "This disbursement is necessary because...",
    });

    expect(result.success).toBe(true);
  });

  test("fails when the justification is missing", () => {
    const result = disbursementJustificationSchema.safeParse({
      justification: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes("justification"),
      );
      expect(issue?.message).toBe(
        "Enter the reason this disbursement is necessary.",
      );
    }
  });

  test("fails when the justification is only whitespace", () => {
    const result = disbursementJustificationSchema.safeParse({
      justification: "   ",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes("justification"),
      );
      expect(issue?.message).toBe(
        "Enter the reason this disbursement is necessary.",
      );
    }
  });

  test("fails when the justification exceeds 500 words", () => {
    const result = disbursementJustificationSchema.safeParse({
      justification: "word ".repeat(501),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes("justification"),
      );
      expect(issue?.message).toBe("Justification must be 500 words or less");
    }
  });
});
