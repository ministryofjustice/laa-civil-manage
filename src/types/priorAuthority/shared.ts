import type { UploadedDocument } from "#src/types/priorAuthority/expert.js";

export type PriorAuthorityType = "Expert" | "Disbursement" | "Counsel";

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

export type { UploadedDocument };
