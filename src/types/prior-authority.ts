export type PriorAuthorityType = "Expert" | "Expense" | "Counsel";
export type PriorAuthorityExpertFullName = string;
export interface PriorAuthority {
  type?: PriorAuthorityType;
  expertType?: string;
  fullName?: PriorAuthorityExpertFullName;
}
