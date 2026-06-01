export type PriorAuthorityType = "Expert" | "Disbursement" | "Counsel";
export type PriorAuthorityExpertFullName = string;
export type PriorAuthorityExpertType = string;
export type PriorAuthorityDocuments = string[];
export type PriorAuthorityBillingType = "Hourly" | "Flat rate";

export interface PriorAuthorityEstimatedTime {
  estimatedHours: string;
  estimatedMinutes: string;
}
export interface UploadedDocument {
  fileName: string;
  originalFileName: string;
}

export type PriorAuthorityIsGuidelineRateExceeded = "Yes" | "No";
export type PriorAuthorityExpertBasedInLondon = "Yes" | "No";

export interface PriorAuthority {
  type?: PriorAuthorityType;
  expertType?: PriorAuthorityExpertType;
  fullName?: PriorAuthorityExpertFullName;
  uploadedDocuments?: UploadedDocument[];
  guidelineRatesExceeded?: PriorAuthorityIsGuidelineRateExceeded;
  expertBasedInLondon?: PriorAuthorityExpertBasedInLondon;
  billingType?: PriorAuthorityBillingType;
  hourlyRate?: string;
  estimatedTime?: PriorAuthorityEstimatedTime;
  totalAmount?: string;
  flatRateTotalAmount?: string;
}

interface ExpertCostsCommonBody {
  PriorAuthorityExpertFullName: PriorAuthorityExpertFullName;
}

export interface ExpertCostsHourlyBody extends ExpertCostsCommonBody {
  PriorAuthorityBillingType: "Hourly";
  PriorAuthorityHourlyRate: string;
  PriorAuthorityEstimatedTime: {
    PriorAuthorityEstimatedHours: string;
    PriorAuthorityEstimatedMinutes: string;
  };
  PriorAuthorityTotalAmount: string;
  PriorAuthorityFlatRateTotalAmount?: never;
}

export interface ExpertCostsFlatRateBody extends ExpertCostsCommonBody {
  PriorAuthorityBillingType: "Flat rate";
  PriorAuthorityFlatRateTotalAmount: string;
  PriorAuthorityHourlyRate?: never;
  PriorAuthorityEstimatedTime?: {
    PriorAuthorityEstimatedHours?: never;
    PriorAuthorityEstimatedMinutes?: never;
  };
  PriorAuthorityTotalAmount?: never;
}

export type ExpertCostsBody = ExpertCostsHourlyBody | ExpertCostsFlatRateBody;
