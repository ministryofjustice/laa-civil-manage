import { calculateHourlyCost } from "#src/utils/calculateHourlyCost.js";
import { describe, expect, it } from "bun:test";

describe("calculateHourlyCost", () => {
  it("returns the hourly total rounded to two decimal places", () => {
    const result = calculateHourlyCost({
      hourlyRate: "90",
      estimatedHours: "2",
      estimatedMinutes: "30",
    });

    expect(result).toBe("225.00");
  });

  it("handles partial hours from minutes", () => {
    const result = calculateHourlyCost({
      hourlyRate: "150",
      estimatedHours: "0",
      estimatedMinutes: "45",
    });

    expect(result).toBe("112.50");
  });
});
