export type CounselType = "King's Counsel alone" | "Two Junior Counsel" | "King's Counsel and Junior Counsel" | "King's Counsel and Two Junior Counsel";

export interface CounselPriorAuthority {
  counselType?: CounselType;
}