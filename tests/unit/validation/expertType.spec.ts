import { typeOfExpert } from "#src/validation/expert-type.js";
import { describe, test, expect } from "bun:test";

describe("typeOfExpert Zod Schema", () => {
  const ERROR_MESSAGE =
    "Search for and select an expert type";

  test("should pass validation when a valid expert type is provided", () => {
    const validData = {
      PriorAuthorityExpertType: "Dentist",
    };

    const result = typeOfExpert.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test("should fail and return the correct error message when the string is empty", () => {
    const invalidData = {
      PriorAuthorityExpertType: "",
    };

    const result = typeOfExpert.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(ERROR_MESSAGE);
    }
  });

  test("should fail and return the correct error message when the value is not a string", () => {
    const invalidData = {
      PriorAuthorityExpertType: 12345,
    };

    const result = typeOfExpert.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(ERROR_MESSAGE);
    }
  });

  test("should fail and return the correct error message when the value is just whitespace", () => {
    const invalidData = {
      PriorAuthorityExpertType: "   ",
    };

    const result = typeOfExpert.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(ERROR_MESSAGE);
    }
  });

  test("should pass validation when the value contains numbers and symbols", () => {
    const validData = {
      PriorAuthorityExpertType: "John Doe 123!@#$",
    };

    const result = typeOfExpert.safeParse(validData);

    expect(result.success).toBe(true);
  });
});
