import type {
  PriorAuthority,
  PriorAuthorityType,
} from "#src/types/priorAuthority/shared.js";
import type {
  PriorAuthorityBillingType,
  PriorAuthorityExpert,
} from "#src/types/priorAuthority/expert.js";
import type { PriorAuthorityCounsel } from "#src/types/priorAuthority/counsel.js";
import { TEMP_EXPERT_POSTCODE } from "#src/constants.js";
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
  priorAuthority: PriorAuthority,
): PriorAuthorityApplicationRequest => {
  switch (priorAuthority.type) {
    case "Counsel":
      return mapCounselToApplicationRequest(
        applicationId,
        priorAuthority.type,
        priorAuthority.counsel,
      );
    case "Expert":
      return mapExpertToApplicationRequest(
        applicationId,
        priorAuthority.type,
        priorAuthority.expert,
      );
    case "Disbursement":
      throw new PriorAuthorityApplicationMappingError(
        "Disbursement prior authority type not yet implemented.",
      );
    case undefined:
      throw new PriorAuthorityApplicationMappingError(
        "Prior authority type is required.",
      );
  }
};

const mapCounselToApplicationRequest = (
  applicationId: string,
  type: PriorAuthorityType,
  counsel: PriorAuthorityCounsel,
): PriorAuthorityApplicationRequest => ({
  applicationId,
  priorAuthorityType: TYPE_MAP[type],
  counselType: counsel.counselType,
  uploadedDocuments: counsel.uploadedDocuments?.map((doc) => ({
    fileName: doc.fileName,
  })),
  justification: counsel.justification,
});

const mapExpertToApplicationRequest = (
  applicationId: string,
  type: PriorAuthorityType,
  expert: PriorAuthorityExpert,
): PriorAuthorityApplicationRequest => {
  if (expert.fullName === undefined) {
    throw new PriorAuthorityApplicationMappingError("fullName is required");
  }
  if (expert.billingType === undefined) {
    throw new PriorAuthorityApplicationMappingError("billingType is required");
  }

  const base: PriorAuthorityApplicationRequest = {
    applicationId,
    priorAuthorityType: TYPE_MAP[type],
    expertType: expert.expertType,
    expertFullName: expert.fullName,
    expertPostcode: TEMP_EXPERT_POSTCODE,
    uploadedDocuments: expert.uploadedDocuments?.map((doc) => ({
      fileName: doc.fileName,
    })),
    expertBasedInLondon:
      expert.expertBasedInLondon == null
        ? undefined
        : expert.expertBasedInLondon === "Yes",
    billingType: BILLING_TYPE_MAP[expert.billingType],
    totalAmount: 0,
    justification: expert.justification,
  };

  if (expert.billingType === "Hourly") {
    return {
      ...base,
      hourlyRate: toNumber(expert.hourlyRate, "hourlyRate"),
      timeHours: toInteger(expert.estimatedTime?.estimatedHours, "timeHours"),
      timeMinutes: toInteger(
        expert.estimatedTime?.estimatedMinutes,
        "timeMinutes",
      ),
      totalAmount: toNumber(expert.totalAmount, "totalAmount"),
    };
  }

  return {
    ...base,
    totalAmount: toNumber(expert.fixedRateTotalAmount, "totalAmount"),
  };
};

export { PriorAuthorityApplicationMappingError };
