export type counselType =
  | "KINGS_COUNSEL_ALONE"
  | "TWO_JUNIOR_COUNSEL"
  | "KINGS_COUNSEL_AND_JUNIOR_COUNSEL"
  | "KINGS_COUNSEL_AND_TWO_JUNIOR_COUNSEL";

export interface PriorAuthorityCounsel {
  counselType?: counselType;
  justification?: string;
}
