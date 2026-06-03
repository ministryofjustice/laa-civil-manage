export type PriorAuthorityApplicationType =
  | "EXPERT"
  | "DISBURSEMENT"
  | "COUNSEL";
export type PriorAuthorityApplicationBillingType = "HOURLY" | "FLAT_RATE";
export type PriorAuthorityApplicationStatus = "ACCEPTED" | "REJECTED";

export interface PriorAuthorityApplicationDocument {
  fileName: string;
}

export interface PriorAuthorityApplicationEstimatedTime {
  hours: number;
  minutes: number;
}

export interface PriorAuthorityApplicationRequest {
  applicationId: string;
  type: PriorAuthorityApplicationType;
  expertType?: string;
  expertFullName: string;
  uploadedDocuments?: PriorAuthorityApplicationDocument[];
  guidelineRatesExceeded: boolean;
  expertBasedInLondon?: boolean;
  billingType: PriorAuthorityApplicationBillingType;
  hourlyRate?: number;
  estimatedTime?: PriorAuthorityApplicationEstimatedTime;
  totalAmount?: number;
  flatRateTotalAmount?: number;
}

export interface PriorAuthorityApplicationResponse {
  submissionId: string;
  status: PriorAuthorityApplicationStatus;
  submittedAt: string;
}
