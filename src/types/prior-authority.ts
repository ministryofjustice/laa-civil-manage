export type PriorAuthorityType = "Expert" | "Expense" | "Counsel";
export type PriorAuthorityExpertFullName = string;
export type PriorAuthorityExpertType = string;
export type PriorAuthorityDocuments = string[];
export interface PriorAuthority {
  type?: PriorAuthorityType;
  expertType?: PriorAuthorityExpertType;
  fullName?: PriorAuthorityExpertFullName;
  uploadedDocuments?: PriorAuthorityDocuments;
}
