export type PriorAuthorityType = "Expert" | "Disbursement" | "Counsel";

export interface UploadedDocument {
  fileName: string;
  originalFileName: string;
}

export interface PriorAuthority {
  type?: PriorAuthorityType;
  expertType?: string;
  fullName?: string;
  expertPostcode?: string;
  uploadedDocuments?: UploadedDocument[];
  guidelineRatesExceeded?: "Yes" | "No";
  expertBasedInLondon?: "Yes" | "No";
  billingType?: "Hourly" | "Fixed rate";
  hourlyRate?: string;
  estimatedTime?: {
    estimatedHours?: string;
    estimatedMinutes?: string;
  };
  totalAmount?: string;
  fixedRateTotalAmount?: string;
  justification?: string;
  counselType?: string;
}
