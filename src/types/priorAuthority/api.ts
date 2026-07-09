export type PriorAuthorityApplicationType =
  | "EXPERT"
  | "DISBURSEMENT"
  | "COUNSEL";
export type PriorAuthorityApplicationBillingType = "HOURLY" | "FIXED_RATE";
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
  priorAuthorityType: PriorAuthorityApplicationType;
  expertType?: string;
  expertFullName?: string;
  expertPostcode?: string;
  uploadedDocuments?: PriorAuthorityApplicationDocument[];
  expertBasedInLondon?: boolean;
  billingType: PriorAuthorityApplicationBillingType;
  hourlyRate?: number;
  timeHours?: number;
  timeMinutes?: number;
  totalAmount: number;
  justification?: string;
}

export interface PriorAuthorityApplicationResponse {
  submissionId: string;
  status: PriorAuthorityApplicationStatus;
  submittedAt: string;
}

export interface PriorAuthorityExpertType {
  value: string;
  text: string;
}
