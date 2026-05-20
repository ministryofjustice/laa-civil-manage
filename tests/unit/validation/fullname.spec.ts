import { fullNameOfExpertSchema } from "#src/validation/prior-authority.js";
import { describe, test, expect } from "bun:test";

describe("fullNameOfExpert Zod Schema", () => {
  const ERROR_MESSAGE = "Enter the expert's full name";

  test("should pass validation when a valid full name is provided", () => {
    const validData = {
      PriorAuthorityExpertFullName: "Jane Doe",
    };

    const result = fullNameOfExpertSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test("should fail and return the correct error message when the string is empty", () => {
    const invalidData = {
      PriorAuthorityExpertFullName: "",
    };

    const result = fullNameOfExpertSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(ERROR_MESSAGE);
    }
  });

  test("should fail and return the correct error message when the value is not a string", () => {
    const invalidData = {
      PriorAuthorityExpertFullName: 12345,
    };

    const result = fullNameOfExpertSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(ERROR_MESSAGE);
    }
  });

  test("should fail and return the correct error message when the value is just whitespace", () => {
    const invalidData = {
      PriorAuthorityExpertFullName: "   ",
    };

    const result = fullNameOfExpertSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(ERROR_MESSAGE);
    }
  });

  test("should pass validation when the value contains numbers and symbols", () => {
    const validData = {
      PriorAuthorityExpertFullName: "John Doe 123!@#$",
    };

    const result = fullNameOfExpertSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });
});
