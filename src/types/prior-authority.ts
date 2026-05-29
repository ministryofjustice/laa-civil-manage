export type PriorAuthorityType = "Expert" | "Expense" | "Counsel";
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

export interface ExpertCostsHourlyBody {
  PriorAuthorityBillingType: "Hourly";
  PriorAuthorityHourlyRate: string;
  PriorAuthorityEstimatedTime: {
    PriorAuthorityEstimatedHours: string;
    PriorAuthorityEstimatedMinutes: string;
  };
  PriorAuthorityTotalAmount: string;
  PriorAuthorityFlatRateTotalAmount?: never;
}

export interface ExpertCostsFlatRateBody {
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
