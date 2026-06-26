import type {
  OsPlacesAddressOption,
  OsPlacesLookupResult,
} from "#src/types/osPlaces.js";
import axios from "#node_modules/axios/index.js";
import { logger } from "#src/utils/logger.js";

export type LondonAssessment = "in-london" | "outside-london" | "mixed";

const LONDON_CUSTODIAN_CODES = new Set<number>([
  5010, 5020, 5030, 5040, 5050, 5060, 5070, 5080, 5090, 5100, 5110, 5120, 5130,
  5210, 5220, 5230, 5240, 5250, 5260, 5270, 5280, 5290, 5310, 5320, 5330, 5340,
  5350, 5360, 5370, 5380, 5390, 5400, 5990,
]);

const normalizePostcode = (postcode: string): string =>
  postcode.trim().replace(/\s+/gv, " ").toUpperCase();

const normalizeCustodianCode = (
  code: number | string | undefined,
): number | undefined => {
  if (code === undefined) {
    return undefined;
  }

  if (typeof code === "number") {
    return code;
  }

  const parsedCode = Number.parseInt(code, 10);
  return Number.isNaN(parsedCode) ? undefined : parsedCode;
};

const isLondonCustodianCode = (code: number | string | undefined): boolean => {
  const normalizedCode = normalizeCustodianCode(code);
  return (
    normalizedCode !== undefined && LONDON_CUSTODIAN_CODES.has(normalizedCode)
  );
};

const hasCustodianCode = (code: number | string | undefined): boolean =>
  normalizeCustodianCode(code) !== undefined;

interface OsPlacesDpaRecord {
  UPRN?: string;
  ADDRESS?: string;
  POSTCODE?: string;
  LOCAL_CUSTODIAN_CODE?: number | string;
}

interface OsPlacesResult {
  DPA?: OsPlacesDpaRecord;
}

interface OsPlacesApiResponse {
  results?: OsPlacesResult[];
}

interface OsPlacesConfig {
  baseUrl: string;
  apiKey?: string;
}

const OS_PLACES_PAGE_SIZE = 100;
const OS_PLACES_MAX_PAGES = 50;

const getOsPlacesConfig = (): OsPlacesConfig => ({
  baseUrl: "https://api.os.uk/search/places/v1",
  apiKey: process.env.OS_PLACES_API_KEY?.trim(),
});

const mapDpaRecordToAddress = (
  record: OsPlacesDpaRecord,
): OsPlacesAddressOption => {
  const postcode = normalizePostcode(record.POSTCODE ?? "");
  return {
    uprn: record.UPRN ?? record.ADDRESS ?? "",
    label: record.ADDRESS ?? postcode,
    postcode,
    localCustodianCode: record.LOCAL_CUSTODIAN_CODE,
  };
};

const mapResultsToAddresses = (
  results: OsPlacesResult[] | undefined,
): OsPlacesAddressOption[] =>
  results
    ?.map((result) => result.DPA)
    .filter((dpa): dpa is OsPlacesDpaRecord => dpa !== undefined)
    .map(mapDpaRecordToAddress) ?? [];

const requestFindAddresses = async (
  baseUrl: string,
  apiKey: string,
  postcode: string,
  address: string,
): Promise<OsPlacesAddressOption[]> => {
  try {
    const response = await axios.get<OsPlacesApiResponse>(`${baseUrl}/find`, {
      params: {
        query: address,
        key: apiKey,
      },
      timeout: 10000,
    });

    const addresses = mapResultsToAddresses(response.data.results);

    return addresses;
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? `OS Places /find failed: status=${String(error.response?.status)} data=${JSON.stringify(error.response?.data ?? {})}`
      : "OS Places /find failed with non-axios error";

    logger.logError("findAddressByPostcodeAndAddress", message, error);
    throw error;
  }
};

const requestPostcodeAddresses = async (
  baseUrl: string,
  apiKey: string,
  postcode: string,
): Promise<OsPlacesAddressOption[]> => {
  const loadPage = async (
    page: number,
    accumulatedAddresses: OsPlacesAddressOption[],
  ): Promise<OsPlacesAddressOption[]> => {
    if (page >= OS_PLACES_MAX_PAGES) {
      logger.logError(
        "lookupAddressesByPostcode",
        `Reached pagination safety cap while looking up postcode ${postcode}`,
      );
      return accumulatedAddresses;
    }

    const offset = page * OS_PLACES_PAGE_SIZE;
    const response = await axios.get<OsPlacesApiResponse>(
      `${baseUrl}/postcode`,
      {
        params: {
          postcode,
          key: apiKey,
          maxresults: OS_PLACES_PAGE_SIZE,
          offset,
        },
        timeout: 10000,
      },
    );

    const pageAddresses = mapResultsToAddresses(response.data.results);
    const nextAddresses = [...accumulatedAddresses, ...pageAddresses];

    if (pageAddresses.length < OS_PLACES_PAGE_SIZE) {
      return nextAddresses;
    }

    return await loadPage(page + 1, nextAddresses);
  };

  return await loadPage(0, []);
};

export const assessAddressesForLondon = (
  addresses: OsPlacesAddressOption[],
): LondonAssessment => {
  const custodianCodes = addresses.map((address) => address.localCustodianCode);
  const hasMissingCode = custodianCodes.some((code) => !hasCustodianCode(code));

  if (hasMissingCode) {
    return "mixed";
  }

  const londonMatches = custodianCodes.map((code) =>
    isLondonCustodianCode(code),
  );

  if (londonMatches.every(Boolean)) {
    return "in-london";
  }

  if (londonMatches.every((match) => !match)) {
    return "outside-london";
  }

  return "mixed";
};

export const findAddressByPostcodeAndAddress = async (
  postcode: string,
  address: string,
  fallbackAddresses: OsPlacesAddressOption[] = [],
): Promise<OsPlacesAddressOption | undefined> => {
  const normalizedPostcode = normalizePostcode(postcode);
  const normalizedAddress = address.trim().toUpperCase();

  const fallbackMatch = fallbackAddresses.find(
    (address) =>
      address.label.trim().toUpperCase() === normalizedAddress &&
      normalizePostcode(address.postcode) === normalizedPostcode,
  );

  if (process.env.OS_PLACES_USE_STUB === "true") {
    return fallbackMatch;
  }

  const config = getOsPlacesConfig();

  if (!config.apiKey) {
    return fallbackMatch;
  }

  const addresses = await requestFindAddresses(
    config.baseUrl,
    config.apiKey,
    normalizedPostcode,
    address,
  );

  return addresses[0];
};

export const isAddressInLondon = (address: OsPlacesAddressOption): boolean =>
  isLondonCustodianCode(address.localCustodianCode);

export const lookupAddressesByPostcode = async (
  postcode: string,
): Promise<OsPlacesLookupResult> => {
  const normalizedPostcode = normalizePostcode(postcode);

  const config = getOsPlacesConfig();

  if (!config.apiKey) {
    return {
      postcode: normalizedPostcode,
      addresses: [],
    };
  }

  const addresses = await requestPostcodeAddresses(
    config.baseUrl,
    config.apiKey,
    normalizedPostcode,
  );

  return {
    postcode: normalizedPostcode,
    addresses,
  };
};
