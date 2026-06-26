import {
  assessAddressesForLondon,
  lookupAddressesByPostcode,
  type LondonAssessment,
} from "#src/models/osPlacesModels.js";
import { describe, expect, it } from "bun:test";

const parseLivePostcodes = (): string[] =>
  (process.env.OS_PLACES_LIVE_POSTCODES ?? "")
    .split(",")
    .map((postcode) => postcode.trim())
    .filter((postcode) => postcode.length > 0);

const isValidAssessment = (value: string): value is LondonAssessment =>
  value === "in-london" || value === "outside-london" || value === "mixed";

describe("osPlaces live checks", () => {
  it("checks known high-volume postcodes when explicitly enabled", async () => {
    if (process.env.OS_PLACES_LIVE_TEST !== "true") {
      return;
    }

    const postcodes = parseLivePostcodes();

    expect(process.env.OS_PLACES_API_KEY).toBeTruthy();
    expect(postcodes.length).toBeGreaterThan(0);

    const results = await Promise.all(
      postcodes.map(
        async (postcode) => await lookupAddressesByPostcode(postcode),
      ),
    );

    results.forEach((result) => {
      expect(result.addresses.length).toBeGreaterThan(100);

      const assessment = assessAddressesForLondon(result.addresses);
      expect(isValidAssessment(assessment)).toBe(true);
    });
  });
});
