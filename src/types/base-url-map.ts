export enum Endpoint {
  GetApplications = "GetApplications",
  GetAssignedApplications = "GetAssignedApplications",
  GetApplicationById = "GetApplicationById",
  GetCertificateByApplicationId = "GetCertificateByApplicationId",
  AssignApplicationToUser = "AssignApplicationToUser",
  MakeDecision = "MakeDecision",
  Healthcheck = "Healthcheck",
  SetMockData = "SetMockData",
  GetUser = "GetUser",
}

export interface Urls {
  default: string;
  [key: string]: string;
}

export type Endpoints = Partial<Record<Endpoint, string>>;

export interface BaseUrlMap {
  urls: Urls;
  endpoints?: Endpoints;
}
