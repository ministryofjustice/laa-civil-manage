import type {
  PriorAuthority,
  PriorAuthorityBillingType,
  PriorAuthorityType,
} from "#src/types/prior-authority.js";
import type {
  PriorAuthorityApplicationBillingType,
  PriorAuthorityApplicationRequest,
  PriorAuthorityApplicationType,
} from "#src/types/prior-authority-api.js";

const TYPE_MAP: Record<PriorAuthorityType, PriorAuthorityApplicationType> = {
  Expert: "EXPERT",
  Disbursement: "DISBURSEMENT",
  Counsel: "COUNSEL",
};

const BILLING_TYPE_MAP: Record<
  PriorAuthorityBillingType,
  PriorAuthorityApplicationBillingType
> = {
  Hourly: "HOURLY",
  "Fixed cost": "FLAT_RATE",
};

class PriorAuthorityApplicationMappingError extends Error {
  constructor(message: string) {
    super(`Cannot map prior-authority for application: ${message}`);
    this.name = "PriorAuthorityApplicationMappingError";
  }
}

const toNumber = (value: string | undefined, fieldName: string): number => {
  if (value === undefined || value.trim() === "") {
    throw new PriorAuthorityApplicationMappingError(`${fieldName} is required`);
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new PriorAuthorityApplicationMappingError(
      `${fieldName} is not a valid number: ${value}`,
    );
  }
  return parsed;
};

const toInteger = (value: string | undefined, fieldName: string): number => {
  const parsed = toNumber(value, fieldName);
  if (!Number.isInteger(parsed)) {
    throw new PriorAuthorityApplicationMappingError(
      `${fieldName} must be a whole number: ${value}`,
    );
  }
  return parsed;
};

export const mapPriorAuthorityToApplicationRequest = (
  applicationId: string,
  priorAuthority: Partial<PriorAuthority>,
): PriorAuthorityApplicationRequest => {
  if (!priorAuthority.type) {
    throw new PriorAuthorityApplicationMappingError("type is required");
  }
  if (!priorAuthority.fullName) {
    throw new PriorAuthorityApplicationMappingError("fullName is required");
  }
  if (!priorAuthority.billingType) {
    throw new PriorAuthorityApplicationMappingError("billingType is required");
  }

  const base: PriorAuthorityApplicationRequest = {
    applicationId,
    type: TYPE_MAP[priorAuthority.type],
    expertType: priorAuthority.expertType,
    expertFullName: priorAuthority.fullName,
    uploadedDocuments: priorAuthority.uploadedDocuments?.map((doc) => ({
      fileName: doc.fileName,
    })),
    guidelineRatesExceeded: priorAuthority.guidelineRatesExceeded === "Yes",
    billingType: BILLING_TYPE_MAP[priorAuthority.billingType],
  };

  if (priorAuthority.billingType === "Hourly") {
    return {
      ...base,
      hourlyRate: toNumber(priorAuthority.hourlyRate, "hourlyRate"),
      estimatedTime: {
        hours: toInteger(
          priorAuthority.estimatedTime?.estimatedHours,
          "estimatedTime.hours",
        ),
        minutes: toInteger(
          priorAuthority.estimatedTime?.estimatedMinutes,
          "estimatedTime.minutes",
        ),
      },
      totalAmount: toNumber(priorAuthority.totalAmount, "totalAmount"),
    };
  }

  return {
    ...base,
    flatRateTotalAmount: toNumber(
      priorAuthority.flatRateTotalAmount,
      "flatRateTotalAmount",
    ),
  };
};

export { PriorAuthorityApplicationMappingError };
