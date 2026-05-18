export type PriorAuthorityType = "Expert" | "Expense" | "Counsel";
export type PriorAuthorityExpertFullName = string;
export type PriorAuthorityExpertType = string;
export type PriorAuthorityDocuments = string[];
export type PriorAuthorityBillingType = "Hourly" | "Flat rate";

export interface PriorAuthorityEstimatedTime {
  estimatedHours: string;
  estimatedMinutes: string;
};
export interface UploadedDocument {
  fileName: string;
  originalFileName: string;
}

export type PriorAuthorityIsGuidelineRateExceeded = "Yes" | "No";
export interface PriorAuthority {
  type?: PriorAuthorityType;
  expertType?: PriorAuthorityExpertType;
  fullName?: PriorAuthorityExpertFullName;
  uploadedDocuments?: UploadedDocument[];
  guidelineRatesExceeded?: PriorAuthorityIsGuidelineRateExceeded;
  billingType?: PriorAuthorityBillingType;
  hourlyRate?: string;
  estimatedTime?: PriorAuthorityEstimatedTime;
  totalAmount?: string;
  flatRateTotalAmount?: string;
}
