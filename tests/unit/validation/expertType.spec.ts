import { typeOfExpertSchema } from "#src/validation/prior-authority.js";
import { describe, test, expect } from "bun:test";

describe("typeOfExpert Zod Schema", () => {
  const ERROR_MESSAGE = "Search for and select an expert type";

  test("should pass validation when a valid expert type is provided", () => {
    const validData = {
      PriorAuthorityExpertType: "Dentist",
    };

    const result = typeOfExpertSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test("should fail and return the correct error message when the string is empty", () => {
    const invalidData = {
      PriorAuthorityExpertType: "",
    };

    const result = typeOfExpertSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(ERROR_MESSAGE);
    }
  });

  test("should fail and return the correct error message when the value is not a string", () => {
    const invalidData = {
      PriorAuthorityExpertType: 12345,
    };

    const result = typeOfExpertSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(ERROR_MESSAGE);
    }
  });

  test("should fail and return the correct error message when the value is just whitespace", () => {
    const invalidData = {
      PriorAuthorityExpertType: "   ",
    };

    const result = typeOfExpertSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(ERROR_MESSAGE);
    }
  });

  test("should pass validation when the value contains numbers and symbols", () => {
    const validData = {
      PriorAuthorityExpertType: "John Doe 123!@#$",
    };

    const result = typeOfExpertSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test("should pass validation when Other is selected and a custom expert type is provided", () => {
    const validData = {
      PriorAuthorityExpertType: "Other",
      PriorAuthorityExpertTypeOther: "Independent social worker",
    };

    const result = typeOfExpertSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test("should fail when Other is selected and no custom expert type is provided", () => {
    const invalidData = {
      PriorAuthorityExpertType: "Other",
      PriorAuthorityExpertTypeOther: "   ",
    };

    const result = typeOfExpertSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Enter the expert type");
    }
  });

  test("should fail when a custom expert type is entered without selecting Other", () => {
    const invalidData = {
      PriorAuthorityExpertType: "Dentist",
      PriorAuthorityExpertTypeOther: "Independent social worker",
    };

    const result = typeOfExpertSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Clear the expert type text unless you selected Other",
      );
    }
  });
});
