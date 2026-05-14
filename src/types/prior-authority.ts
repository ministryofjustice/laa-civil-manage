export type PriorAuthorityType = "Expert" | "Expense" | "Counsel";
export type PriorAuthorityExpertFullName = string;
export type PriorAuthorityExpertType = string;
export type PriorAuthorityGuidelineRatesExceeded = "Yes" | "No";
export interface PriorAuthority {
  type?: PriorAuthorityType;
  expertType?: PriorAuthorityExpertType;
  fullName?: PriorAuthorityExpertFullName;
  guidelineRatesExceeded?: PriorAuthorityGuidelineRatesExceeded;
}
