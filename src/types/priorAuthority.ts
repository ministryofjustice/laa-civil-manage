export type PriorAuthorityType = "Expert" | "Disbursement" | "Counsel";
export type PriorAuthorityExpertFullName = string;
export type PriorAuthorityExpertType = string;
export type PriorAuthorityDocuments = string[];
export type PriorAuthorityBillingType = "Hourly" | "Fixed rate";

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
  expertPostcode?: string;
  uploadedDocuments?: UploadedDocument[];
  guidelineRatesExceeded?: PriorAuthorityIsGuidelineRateExceeded;
  expertBasedInLondon?: PriorAuthorityExpertBasedInLondon;
  billingType?: PriorAuthorityBillingType;
  hourlyRate?: string;
  estimatedTime?: PriorAuthorityEstimatedTime;
  totalAmount?: string;
  fixedRateTotalAmount?: string;
  justification?: string;
}

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
