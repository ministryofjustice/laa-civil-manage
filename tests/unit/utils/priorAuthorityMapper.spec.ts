import { mapExpertCostsBodyToPriorAuthority } from "#src/utils/priorAuthorityMapper.js";
import { describe, expect, it } from "bun:test";

describe("mapExpertCostsBodyToPriorAuthority", () => {
  it("maps all expert-costs fields into PriorAuthority session fields", () => {
    const result = mapExpertCostsBodyToPriorAuthority({
      PriorAuthorityExpertFullName: "Dr Jane Smith",
      PriorAuthorityBillingType: "Hourly",
      PriorAuthorityHourlyRate: "90",
      PriorAuthorityEstimatedTime: {
        PriorAuthorityEstimatedHours: "2",
        PriorAuthorityEstimatedMinutes: "30",
      },
      PriorAuthorityTotalAmount: "225",
    });

    expect(result).toEqual({
      fullName: "Dr Jane Smith",
      billingType: "Hourly",
      hourlyRate: "90",
      estimatedTime: {
        estimatedHours: "2",
        estimatedMinutes: "30",
      },
      totalAmount: "225",
      flatRateTotalAmount: undefined,
    });
  });

  it("clears hourly fields when the billing type is flat rate", () => {
    const result = mapExpertCostsBodyToPriorAuthority({
      PriorAuthorityExpertFullName: "Dr Jane Smith",
      PriorAuthorityBillingType: "Flat rate",
      PriorAuthorityFlatRateTotalAmount: "250",
    });

    expect(result.estimatedTime).toBeUndefined();
    expect(result.hourlyRate).toBeUndefined();
    expect(result.totalAmount).toBeUndefined();
  });
});
