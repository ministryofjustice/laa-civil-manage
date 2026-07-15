export type counselType =
  | "King's Counsel alone"
  | "Two Junior Counsel"
  | "King's Counsel and Junior Counsel"
  | "King's Counsel and Two Junior Counsel";

export interface PriorAuthorityCounsel {
  counselType?: counselType;
}
