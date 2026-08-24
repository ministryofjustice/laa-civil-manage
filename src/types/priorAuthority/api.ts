export type PriorAuthorityApplicationType =
  "EXPERT" | "DISBURSEMENT" | "COUNSEL";
export type PriorAuthorityApplicationBillingType = "HOURLY" | "FIXED_RATE";
export type PriorAuthorityApplicationStatus = "ACCEPTED" | "REJECTED";

export interface PriorAuthorityApplicationDocument {
  fileName: string;
  category?: string;
}

export interface PriorAuthorityApplicationTimeRequested {
  hours: number;
  minutes: number;
}

export interface PriorAuthorityApplicationApportionment {
  partiesSharingCosts: number;
  clientShareAmount: number;
}

export interface PriorAuthorityApplicationExpertCosts {
  billingType: PriorAuthorityApplicationBillingType;
  hourlyRate?: number;
  timeRequested?: PriorAuthorityApplicationTimeRequested;
  totalAmount: number;
  costsSharedWithOtherParties: boolean;
  apportionment?: PriorAuthorityApplicationApportionment;
}

export interface PriorAuthorityApplicationExpertDetails {
  expertType: string;
  expertFullName: string;
  expertPostcode: string;
  expertCosts: PriorAuthorityApplicationExpertCosts;
}

export interface PriorAuthorityApplicationCounselDetails {
  counselType: string;
}

export interface PriorAuthorityApplicationDisbursementDetails {
  disbursementPurpose: string;
  disbursementAmount: number;
}

export interface PriorAuthorityApplicationRequest {
  applicationId: string;
  priorAuthorityType: PriorAuthorityApplicationType;
  justification?: string;
  uploadedDocuments?: PriorAuthorityApplicationDocument[];
  expertDetails?: PriorAuthorityApplicationExpertDetails;
  counselDetails?: PriorAuthorityApplicationCounselDetails;
  disbursementDetails?: PriorAuthorityApplicationDisbursementDetails;
}

export interface PriorAuthorityApplicationResponse {
  submissionId: string;
  status: PriorAuthorityApplicationStatus;
  submittedAt: string;
}
