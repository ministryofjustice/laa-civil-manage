import type {
  PriorAuthority,
  PriorAuthorityBillingType,
  PriorAuthorityType,
} from "#src/types/priorAuthority/form.js";
import {
  TEMP_EXPERT_POSTCODE,
  TEMP_PRIOR_AUTHORITY_JUSTIFICATION,
} from "#src/constants.js";
import type {
  PriorAuthorityApplicationBillingType,
  PriorAuthorityApplicationRequest,
  PriorAuthorityApplicationType,
} from "#src/types/priorAuthority/api.js";

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
  "Fixed rate": "FIXED_RATE",
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
    priorAuthorityType: TYPE_MAP[priorAuthority.type],
    expertType: priorAuthority.expertType,
    expertFullName: priorAuthority.fullName,
    expertPostcode: TEMP_EXPERT_POSTCODE,
    uploadedDocuments: priorAuthority.uploadedDocuments?.map((doc) => ({
      fileName: doc.fileName,
    })),
    expertBasedInLondon:
      priorAuthority.expertBasedInLondon == null
        ? undefined
        : priorAuthority.expertBasedInLondon === "Yes",
    billingType: BILLING_TYPE_MAP[priorAuthority.billingType],
    totalAmount: 0,
    justification: TEMP_PRIOR_AUTHORITY_JUSTIFICATION,
  };

  if (priorAuthority.billingType === "Hourly") {
    return {
      ...base,
      hourlyRate: toNumber(priorAuthority.hourlyRate, "hourlyRate"),
      timeHours: toInteger(
        priorAuthority.estimatedTime?.estimatedHours,
        "timeHours",
      ),
      timeMinutes: toInteger(
        priorAuthority.estimatedTime?.estimatedMinutes,
        "timeMinutes",
      ),
      totalAmount: toNumber(priorAuthority.totalAmount, "totalAmount"),
    };
  }

  return {
    ...base,
    totalAmount: toNumber(priorAuthority.fixedRateTotalAmount, "totalAmount"),
  };
};

export { PriorAuthorityApplicationMappingError };
