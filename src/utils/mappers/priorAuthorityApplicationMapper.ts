import type {
  PriorAuthority,
  PriorAuthorityType,
} from "#src/types/priorAuthority/shared.js";
import type {
  PriorAuthorityBillingType,
  PriorAuthorityExpert,
} from "#src/types/priorAuthority/expert.js";
import type { PriorAuthorityCounsel } from "#src/types/priorAuthority/counsel.js";
import type { PriorAuthorityDisbursement } from "#src/types/priorAuthority/disbursement.js";
import type {
  PriorAuthorityApplicationApportionment,
  PriorAuthorityApplicationBillingType,
  PriorAuthorityApplicationExpertCosts,
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
  laaReference: string,
  priorAuthority: PriorAuthority,
): PriorAuthorityApplicationRequest => {
  const type = priorAuthority.type;
  if (!type) {
    throw new PriorAuthorityApplicationMappingError("type is required");
  }

  const priorAuthorityType = TYPE_MAP[type];

  switch (type) {
    case "Counsel":
      return mapCounselToApplicationRequest(
        applicationId,
        laaReference,
        priorAuthorityType,
        priorAuthority.counsel,
      );
    case "Expert":
      return mapExpertToApplicationRequest(
        applicationId,
        laaReference,
        priorAuthorityType,
        priorAuthority.expert,
      );
    case "Disbursement":
      return mapDisbursementToApplicationRequest(
        applicationId,
        laaReference,
        priorAuthorityType,
        priorAuthority.disbursement,
      );
  }
};

const mapCounselToApplicationRequest = (
  applicationId: string,
  laaReference: string,
  priorAuthorityType: PriorAuthorityApplicationType,
  counsel: PriorAuthorityCounsel,
): PriorAuthorityApplicationRequest => {
  if (counsel.counselType === undefined) {
    throw new PriorAuthorityApplicationMappingError("counselType is required");
  }

  return {
    applicationId,
    laaReference,
    priorAuthorityType,
    justification: counsel.justification,
    uploadedDocuments: counsel.uploadedDocuments?.map((doc) => ({
      fileName: doc.fileName,
      category: doc.category,
    })),
    counselDetails: {
      counselType: counsel.counselType,
    },
  };
};

const mapDisbursementToApplicationRequest = (
  applicationId: string,
  laaReference: string,
  priorAuthorityType: PriorAuthorityApplicationType,
  disbursement: PriorAuthorityDisbursement,
): PriorAuthorityApplicationRequest => {
  if (disbursement.disbursementPurpose === undefined) {
    throw new PriorAuthorityApplicationMappingError(
      "disbursementPurpose is required",
    );
  }

  return {
    applicationId,
    laaReference,
    priorAuthorityType,
    justification: disbursement.justification,
    uploadedDocuments: disbursement.uploadedDocuments?.map((doc) => ({
      fileName: doc.fileName,
      category: doc.category,
    })),
    disbursementDetails: {
      disbursementPurpose: disbursement.disbursementPurpose,
      disbursementAmount: toNumber(
        disbursement.disbursementAmount,
        "disbursementAmount",
      ),
    },
  };
};

const mapApportionment = (
  expert: PriorAuthorityExpert,
): PriorAuthorityApplicationApportionment | undefined => {
  if (expert.costsSharedWithOtherParties !== "Yes") {
    return undefined;
  }

  return {
    partiesSharingCosts: toInteger(
      expert.numberOfParties,
      "partiesSharingCosts",
    ),
    clientShareAmount: toNumber(expert.apportionedAmount, "clientShareAmount"),
  };
};

const mapExpertCosts = (
  expert: PriorAuthorityExpert,
): PriorAuthorityApplicationExpertCosts => {
  if (expert.billingType === undefined) {
    throw new PriorAuthorityApplicationMappingError("billingType is required");
  }
  if (expert.costsSharedWithOtherParties === undefined) {
    throw new PriorAuthorityApplicationMappingError(
      "costsSharedWithOtherParties is required",
    );
  }

  const shared = {
    costsSharedWithOtherParties: expert.costsSharedWithOtherParties === "Yes",
    apportionment: mapApportionment(expert),
  };

  if (expert.billingType === "Hourly") {
    return {
      billingType: BILLING_TYPE_MAP[expert.billingType],
      hourlyRate: toNumber(expert.hourlyRate, "hourlyRate"),
      timeRequested: {
        hours: toInteger(expert.estimatedTime?.estimatedHours, "hours"),
        minutes: toInteger(expert.estimatedTime?.estimatedMinutes, "minutes"),
      },
      totalAmount: toNumber(expert.totalAmount, "totalAmount"),
      ...shared,
    };
  }

  return {
    billingType: BILLING_TYPE_MAP[expert.billingType],
    totalAmount: toNumber(expert.fixedRateTotalAmount, "totalAmount"),
    ...shared,
  };
};

const mapExpertToApplicationRequest = (
  applicationId: string,
  laaReference: string,
  priorAuthorityType: PriorAuthorityApplicationType,
  expert: PriorAuthorityExpert,
): PriorAuthorityApplicationRequest => {
  if (expert.expertType === undefined) {
    throw new PriorAuthorityApplicationMappingError("expertType is required");
  }
  if (expert.fullName === undefined) {
    throw new PriorAuthorityApplicationMappingError("fullName is required");
  }
  if (expert.expertPostcode === undefined) {
    throw new PriorAuthorityApplicationMappingError(
      "expertPostcode is required",
    );
  }

  return {
    applicationId,
    laaReference,
    priorAuthorityType,
    justification: expert.justification,
    uploadedDocuments: expert.uploadedDocuments?.map((doc) => ({
      fileName: doc.fileName,
      category: doc.category,
    })),
    expertDetails: {
      expertType: expert.expertType,
      expertFullName: expert.fullName,
      expertPostcode: expert.expertPostcode,
      expertCosts: mapExpertCosts(expert),
    },
  };
};

export { PriorAuthorityApplicationMappingError };
