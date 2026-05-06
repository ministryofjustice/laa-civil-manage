export type PriorAuthorityType = "Expert" | "Expense" | "Counsel";
export type PriorAuthorityFullName = string;
export interface PriorAuthority {
  type?: PriorAuthorityType;
  fullName?: PriorAuthorityFullName;
}
