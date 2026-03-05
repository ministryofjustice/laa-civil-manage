export interface Application {
  applicationId: string;
  status: string;
  submittedAt: Date;
  lastUpdated: Date;
  usedDelegatedFunctions: boolean;
  categoryOfLaw: string;
  matterType: string;
  assignedTo: string;
  autoGrant: boolean;
  clientFirstName: string;
  clientLastName: string;
  clientDateOfBirth: Date;
  laaReference: string;
  officeCode: string;
  applicationType: string;
  isLead: boolean;
}
