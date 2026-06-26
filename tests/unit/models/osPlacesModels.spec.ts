import {
  assessAddressesForLondon,
  lookupAddressesByPostcode,
} from "#src/models/osPlacesModels.js";
import axios from "#node_modules/axios/index.js";
import { logger } from "#src/utils/logger.js";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
  type Mock,
} from "bun:test";

interface TestOsPlacesResult {
  DPA: {
    UPRN: string;
    ADDRESS: string;
    POSTCODE: string;
    LOCAL_CUSTODIAN_CODE: number;
  };
}

const buildResult = (
  index: number,
  localCustodianCode: number,
): TestOsPlacesResult => ({
  DPA: {
    UPRN: `uprn-${String(index)}`,
    ADDRESS: `${String(index)} Test Street, London`,
    POSTCODE: "SW1A 1AA",
    LOCAL_CUSTODIAN_CODE: localCustodianCode,
  },
});

describe("osPlacesModels", () => {
  let axiosGetSpy: Mock<(...args: unknown[]) => Promise<unknown>>;
  let logErrorSpy: Mock<(...args: unknown[]) => void>;

  beforeEach(() => {
    process.env.OS_PLACES_API_KEY = "test-api-key";

    axiosGetSpy = spyOn(axios, "get") as unknown as Mock<
      (...args: unknown[]) => Promise<unknown>
    >;
    logErrorSpy = spyOn(logger, "logError") as unknown as Mock<
      (...args: unknown[]) => void
    >;

    axiosGetSpy.mockReset();
    logErrorSpy.mockReset();
  });

  afterEach(() => {
    delete process.env.OS_PLACES_API_KEY;
    mock.restore();
  });

  it("loads additional postcode pages when the first page has 100 addresses", async () => {
    const firstPageResults = Array.from({ length: 100 }, (_, index) =>
      buildResult(index, 5010),
    );
    const secondPageResults = [buildResult(100, 9999)];

    axiosGetSpy
      .mockResolvedValueOnce({ data: { results: firstPageResults } })
      .mockResolvedValueOnce({ data: { results: secondPageResults } });

    const result = await lookupAddressesByPostcode("sw1a1aa");

    expect(axiosGetSpy).toHaveBeenCalledTimes(2);
    expect(axiosGetSpy.mock.calls[0]?.[1]).toMatchObject({
      params: {
        postcode: "SW1A1AA",
        maxresults: 100,
        offset: 0,
      },
    });
    expect(axiosGetSpy.mock.calls[1]?.[1]).toMatchObject({
      params: {
        postcode: "SW1A1AA",
        maxresults: 100,
        offset: 100,
      },
    });

    expect(result.addresses).toHaveLength(101);
    expect(assessAddressesForLondon(result.addresses)).toBe("mixed");
  });

  it("logs and returns gathered addresses when pagination safety cap is reached", async () => {
    const fullPageResults = Array.from({ length: 100 }, (_, index) =>
      buildResult(index, 5010),
    );

    for (let page = 0; page < 50; page += 1) {
      axiosGetSpy.mockResolvedValueOnce({ data: { results: fullPageResults } });
    }

    const result = await lookupAddressesByPostcode("sw1a1aa");

    expect(axiosGetSpy).toHaveBeenCalledTimes(50);
    expect(result.addresses).toHaveLength(5000);
    expect(logErrorSpy).toHaveBeenCalledTimes(1);
    expect(assessAddressesForLondon(result.addresses)).toBe("in-london");
  });
});
