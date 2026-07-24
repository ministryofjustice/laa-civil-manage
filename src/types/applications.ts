export interface ApplicationSummary {
  applicationId: string;
  status: string;
  submittedAt: string;
  clientFirstName: string;
  clientLastName: string;
  laaReference: string;
}

export interface Paging {
  page: number;
  pageSize: number;
  itemsReturned: number;
  totalRecords: number;
}

export interface ApplicationsResponse {
  paging: Paging;
  applications: ApplicationSummary[];
}
