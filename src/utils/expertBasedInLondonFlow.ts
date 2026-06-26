import {
  assessAddressesForLondon,
  findAddressByPostcodeAndAddress,
  isAddressInLondon,
  lookupAddressesByPostcode,
} from "#src/models/osPlacesModels.js";
import type { OsPlacesAddressOption } from "#src/types/osPlaces.js";

export interface ExpertBasedInLondonFlowInput {
  postcode: string;
  selectedAddress?: string;
}

export type ExpertBasedInLondonFlowOutcome =
  | {
      type: "final";
      postcode: string;
      addresses: OsPlacesAddressOption[];
      expertBasedInLondon: "Yes" | "No";
      selectedAddress?: string;
    }
  | {
      type: "needs-selection";
      postcode: string;
      addresses: OsPlacesAddressOption[];
      selectedAddress?: string;
    }
  | {
      type: "error";
      postcode: string;
      selectedAddress?: string;
      message: string;
    };

const normalizePostcode = (postcode: string): string =>
  postcode.trim().replace(/\s+/gv, " ").toUpperCase();

const normalizeAddressValue = (
  address: string | undefined,
): string | undefined => {
  const trimmed = address?.trim();
  return trimmed || undefined;
};

export const buildAddressSelectItems = (
  addresses: OsPlacesAddressOption[],
  selectedAddress: string | undefined,
): Array<{ value: string; text: string; selected?: boolean }> => [
  {
    value: "",
    text: "Select an address",
    selected: (selectedAddress ?? "") === "",
  },
  ...addresses.map((address) => ({
    value: address.label,
    text: address.label,
    selected: selectedAddress === address.label,
  })),
];

export const evaluateExpertBasedInLondon = async (
  input: ExpertBasedInLondonFlowInput,
): Promise<ExpertBasedInLondonFlowOutcome> => {
  const postcode = normalizePostcode(input.postcode);
  const selectedAddress = normalizeAddressValue(input.selectedAddress);

  const lookupResult = await lookupAddressesByPostcode(postcode);

  if (lookupResult.addresses.length === 0) {
    return {
      type: "error",
      postcode,
      selectedAddress,
      message: "We could not find any addresses for that postcode.",
    };
  }

  const postcodeAssessment = assessAddressesForLondon(lookupResult.addresses);

  if (postcodeAssessment === "in-london") {
    return {
      type: "final",
      postcode,
      selectedAddress,
      addresses: lookupResult.addresses,
      expertBasedInLondon: "Yes",
    };
  }

  if (postcodeAssessment === "outside-london") {
    return {
      type: "final",
      postcode,
      selectedAddress,
      addresses: lookupResult.addresses,
      expertBasedInLondon: "No",
    };
  }

  if (!selectedAddress) {
    return {
      type: "needs-selection",
      postcode,
      selectedAddress,
      addresses: lookupResult.addresses,
    };
  }

  const findResult = await findAddressByPostcodeAndAddress(
    postcode,
    selectedAddress,
    lookupResult.addresses,
  );

  if (!findResult) {
    return {
      type: "error",
      postcode,
      selectedAddress,
      message:
        "We could not confirm that address. Select an address from the list and try again.",
    };
  }

  return {
    type: "final",
    postcode,
    selectedAddress,
    addresses: lookupResult.addresses,
    expertBasedInLondon: isAddressInLondon(findResult) ? "Yes" : "No",
  };
};
