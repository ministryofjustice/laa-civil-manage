export interface OsPlacesAddressOption {
  uprn: string;
  label: string;
  postcode: string;
  localCustodianCode?: number | string;
}

export interface OsPlacesLookupResult {
  postcode: string;
  addresses: OsPlacesAddressOption[];
}
