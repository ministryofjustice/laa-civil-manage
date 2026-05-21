export type PriorAuthorityType = "Expert" | "Expense" | "Counsel";
export type PriorAuthorityExpertFullName = string;
export type PriorAuthorityExpertType = string;
export type PriorAuthorityDocuments = string[];

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
}
