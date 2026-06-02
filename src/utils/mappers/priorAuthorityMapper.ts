import type {
  ExpertCostsBody,
  PriorAuthority,
} from "#src/types/prior-authority.js";

const calculateHourlyTotalAmount = (
  body: Extract<ExpertCostsBody, { PriorAuthorityBillingType: "Hourly" }>,
): string => {
  const hourlyRate = parseFloat(body.PriorAuthorityHourlyRate);
  const estimatedHours = parseInt(
    body.PriorAuthorityEstimatedTime.PriorAuthorityEstimatedHours,
    10,
  );
  const estimatedMinutes = parseInt(
    body.PriorAuthorityEstimatedTime.PriorAuthorityEstimatedMinutes,
    10,
  );
  const totalCost = hourlyRate * (estimatedHours + estimatedMinutes / 60);

  return (Math.round(totalCost * 100) / 100).toFixed(2);
};

type ExpertCostsSessionFields = Pick<
  PriorAuthority,
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
      billingType: body.PriorAuthorityBillingType,
      hourlyRate: body.PriorAuthorityHourlyRate,
      estimatedTime: {
        estimatedHours:
          body.PriorAuthorityEstimatedTime.PriorAuthorityEstimatedHours,
        estimatedMinutes:
          body.PriorAuthorityEstimatedTime.PriorAuthorityEstimatedMinutes,
      },
      totalAmount: calculateHourlyTotalAmount(body),
      flatRateTotalAmount: undefined,
    };
  }

  return {
    billingType: body.PriorAuthorityBillingType,
    hourlyRate: undefined,
    estimatedTime: undefined,
    totalAmount: undefined,
    flatRateTotalAmount: body.PriorAuthorityFlatRateTotalAmount,
  };
};
