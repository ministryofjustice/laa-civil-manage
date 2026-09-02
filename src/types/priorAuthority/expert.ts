import type { UploadedDocument } from "#src/types/priorAuthority/shared.js";

export type PriorAuthorityExpertFullName = string;
export type PriorAuthorityExpertType = string;
export type PriorAuthorityDocuments = string[];
export type PriorAuthorityBillingType = "Hourly" | "Fixed rate";

export interface PriorAuthorityEstimatedTime {
  estimatedHours: string;
  estimatedMinutes: string;
}

export type PriorAuthorityExpertPostcode = string;
export interface ExpertCostsHourlyBody {
  PriorAuthorityBillingType: "Hourly";
  PriorAuthorityHourlyRate: string;
  PriorAuthorityEstimatedTime: {
    PriorAuthorityEstimatedHours: string;
    PriorAuthorityEstimatedMinutes: string;
  };
  PriorAuthorityFixedRateTotalAmount?: never;
}

export interface ExpertCostsFixedRateBody {
  PriorAuthorityBillingType: "Fixed rate";
  PriorAuthorityFixedRateTotalAmount: string;
  PriorAuthorityHourlyRate?: never;
  PriorAuthorityEstimatedTime?: {
    PriorAuthorityEstimatedHours?: never;
    PriorAuthorityEstimatedMinutes?: never;
  };
  PriorAuthorityTotalAmount?: never;
}

export type ExpertCostsBody = ExpertCostsHourlyBody | ExpertCostsFixedRateBody;

export type PriorAuthorityCostsShared = "Yes" | "No";

export interface PriorAuthorityExpert {
  expertType?: PriorAuthorityExpertType;
  expertTypeIsOther?: boolean;
  fullName?: PriorAuthorityExpertFullName;
  expertPostcode?: PriorAuthorityExpertPostcode;
  uploadedDocuments?: UploadedDocument[];
  billingType?: PriorAuthorityBillingType;
  hourlyRate?: string;
  estimatedTime?: PriorAuthorityEstimatedTime;
  totalAmount?: string;
  fixedRateTotalAmount?: string;
  costsSharedWithOtherParties?: PriorAuthorityCostsShared;
  numberOfParties?: string;
  apportionedAmount?: string;
  justification?: string;
}
