import type {
  ExpertCostsBody,
  PriorAuthority,
} from "#src/types/priorAuthority.js";
import { calculateHourlyCost } from "#src/utils/calculateHourlyCost.js";

type ExpertCostsSessionFields = Pick<
  PriorAuthority,
  | "billingType"
  | "hourlyRate"
  | "estimatedTime"
  | "totalAmount"
  | "fixedRateTotalAmount"
>;

export const mapExpertCostsBodyToPriorAuthority = (
  body: ExpertCostsBody,
): ExpertCostsSessionFields => {
  if (body.PriorAuthorityBillingType === "Hourly") {
    return {
      billingType: body.PriorAuthorityBillingType,
      hourlyRate: body.PriorAuthorityHourlyRate,
      estimatedTime: {
        estimatedHours:
          body.PriorAuthorityEstimatedTime.PriorAuthorityEstimatedHours,
        estimatedMinutes:
          body.PriorAuthorityEstimatedTime.PriorAuthorityEstimatedMinutes,
      },
      totalAmount: calculateHourlyCost({
        hourlyRate: body.PriorAuthorityHourlyRate,
        estimatedHours:
          body.PriorAuthorityEstimatedTime.PriorAuthorityEstimatedHours,
        estimatedMinutes:
          body.PriorAuthorityEstimatedTime.PriorAuthorityEstimatedMinutes,
      }),
      fixedRateTotalAmount: undefined,
    };
  }

  return {
    billingType: body.PriorAuthorityBillingType,
    hourlyRate: undefined,
    estimatedTime: undefined,
    totalAmount: undefined,
    fixedRateTotalAmount: body.PriorAuthorityFixedRateTotalAmount,
  };
};
