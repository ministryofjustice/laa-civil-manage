import type {
  ExpertCostsBody,
  PriorAuthority,
} from "#src/types/prior-authority.js";

type ExpertCostsSessionFields = Pick<
  PriorAuthority,
  | "fullName"
  | "billingType"
  | "hourlyRate"
  | "estimatedTime"
  | "totalAmount"
  | "flatRateTotalAmount"
>;

export const mapExpertCostsBodyToPriorAuthority = (
  body: ExpertCostsBody,
): ExpertCostsSessionFields => {
  if (body.PriorAuthorityBillingType === "Hourly") {
    return {
      fullName: body.PriorAuthorityExpertFullName,
      billingType: body.PriorAuthorityBillingType,
      hourlyRate: body.PriorAuthorityHourlyRate,
      estimatedTime: {
        estimatedHours:
          body.PriorAuthorityEstimatedTime.PriorAuthorityEstimatedHours,
        estimatedMinutes:
          body.PriorAuthorityEstimatedTime.PriorAuthorityEstimatedMinutes,
      },
      totalAmount: body.PriorAuthorityTotalAmount,
      flatRateTotalAmount: undefined,
    };
  }

  return {
    fullName: body.PriorAuthorityExpertFullName,
    billingType: body.PriorAuthorityBillingType,
    hourlyRate: undefined,
    estimatedTime: undefined,
    totalAmount: undefined,
    flatRateTotalAmount: body.PriorAuthorityFlatRateTotalAmount,
  };
};
