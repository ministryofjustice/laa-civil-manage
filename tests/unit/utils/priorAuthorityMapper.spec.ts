import { mapExpertCostsBodyToPriorAuthority } from "#src/utils/mappers/priorAuthorityMapper.js";
import { describe, expect, it } from "bun:test";

describe("mapExpertCostsBodyToPriorAuthority", () => {
  it("maps all expert-costs fields into PriorAuthority session fields", () => {
    const result = mapExpertCostsBodyToPriorAuthority({
      PriorAuthorityBillingType: "Hourly",
      PriorAuthorityHourlyRate: "90",
      PriorAuthorityEstimatedTime: {
        PriorAuthorityEstimatedHours: "2",
        PriorAuthorityEstimatedMinutes: "30",
      },
    });

    expect(result).toEqual({
      billingType: "Hourly",
      hourlyRate: "90",
      estimatedTime: {
        estimatedHours: "2",
        estimatedMinutes: "30",
      },
      totalAmount: "225.00",
      fixedRateTotalAmount: undefined,
    });
  });

  it("clears hourly fields when the billing type is Fixed rate", () => {
    const result = mapExpertCostsBodyToPriorAuthority({
      PriorAuthorityBillingType: "Fixed rate",
      PriorAuthorityFixedRateTotalAmount: "250",
    });

    expect(result.estimatedTime).toBeUndefined();
    expect(result.hourlyRate).toBeUndefined();
    expect(result.totalAmount).toBeUndefined();
  });
});
