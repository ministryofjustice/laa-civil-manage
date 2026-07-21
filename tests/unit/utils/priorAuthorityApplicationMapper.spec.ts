import { mapPriorAuthorityToApplicationRequest } from "#src/utils/mappers/priorAuthorityApplicationMapper.js";
import type { PriorAuthority } from "#src/types/priorAuthority/shared.js";
import { describe, expect, it } from "bun:test";

const APPLICATION_ID = "5f1b2c3d-1111-2222-3333-444455556666";

const makePriorAuthority = (
  expert: PriorAuthority["expert"],
  type: PriorAuthority["type"] = "Expert",
): PriorAuthority => ({
  type,
  expert,
  counsel: {},
});

describe("mapPriorAuthorityToApplicationRequest", () => {
  it("maps a full hourly submission into the API request shape", () => {
    const priorAuthority = makePriorAuthority({
      expertType: "Psychologist",
      fullName: "Dr Jane Smith",
      uploadedDocuments: [
        { fileName: "abc.pdf", originalFileName: "Medical Report.pdf" },
      ],
      guidelineRatesExceeded: "Yes",
      expertBasedInLondon: "No",
      billingType: "Hourly",
      hourlyRate: "90",
      estimatedTime: { estimatedHours: "2", estimatedMinutes: "30" },
      totalAmount: "225",
      justification: "test justification",
    });

    const result = mapPriorAuthorityToApplicationRequest(
      APPLICATION_ID,
      priorAuthority,
    );

    expect(result).toEqual({
      applicationId: APPLICATION_ID,
      priorAuthorityType: "EXPERT",
      expertType: "Psychologist",
      expertFullName: "Dr Jane Smith",
      expertPostcode: "SW1H 9AJ",
      uploadedDocuments: [{ fileName: "abc.pdf" }],
      expertBasedInLondon: false,
      billingType: "HOURLY",
      hourlyRate: 90,
      timeHours: 2,
      timeMinutes: 30,
      totalAmount: 225,
      justification: "test justification",
    });
  });

  it("maps a flat-rate submission and omits hourly fields", () => {
    const result = mapPriorAuthorityToApplicationRequest(
      APPLICATION_ID,
      makePriorAuthority({
        expertType: "Psychologist",
        fullName: "Dr Jane Smith",
        expertBasedInLondon: "Yes",
        billingType: "Fixed rate",
        fixedRateTotalAmount: "249.99",
        justification: "test justification",
      }),
    );

    expect(result).toEqual({
      applicationId: APPLICATION_ID,
      priorAuthorityType: "EXPERT",
      expertType: "Psychologist",
      expertFullName: "Dr Jane Smith",
      expertPostcode: "SW1H 9AJ",
      uploadedDocuments: undefined,
      expertBasedInLondon: true,
      billingType: "FIXED_RATE",
      totalAmount: 249.99,
      justification: "test justification",
    });
  });

  it("maps the type enum to the API casing", () => {
    const expert = mapPriorAuthorityToApplicationRequest(
      APPLICATION_ID,
      makePriorAuthority({
        fullName: "x",
        billingType: "Fixed rate",
        fixedRateTotalAmount: "1",
      }),
    );
    const disbursement = mapPriorAuthorityToApplicationRequest(
      APPLICATION_ID,
      makePriorAuthority(
        {
          fullName: "x",
          billingType: "Fixed rate",
          fixedRateTotalAmount: "1",
        },
        "Disbursement",
      ),
    );
    const counsel = mapPriorAuthorityToApplicationRequest(
      APPLICATION_ID,
      makePriorAuthority(
        {
          fullName: "x",
          billingType: "Fixed rate",
          fixedRateTotalAmount: "1",
        },
        "Counsel",
      ),
    );

    expect(expert.priorAuthorityType).toBe("EXPERT");
    expect(disbursement.priorAuthorityType).toBe("DISBURSEMENT");
    expect(counsel.priorAuthorityType).toBe("COUNSEL");
  });

  it("strips originalFileName from uploaded documents", () => {
    const result = mapPriorAuthorityToApplicationRequest(
      APPLICATION_ID,
      makePriorAuthority({
        fullName: "x",
        uploadedDocuments: [
          { fileName: "a", originalFileName: "A.pdf" },
          { fileName: "b", originalFileName: "B.pdf" },
        ],
        billingType: "Fixed rate",
        fixedRateTotalAmount: "1",
      }),
    );

    expect(result.uploadedDocuments).toEqual([
      { fileName: "a" },
      { fileName: "b" },
    ]);
  });

  it("throws when type is missing", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(APPLICATION_ID, {
        expert: {
          fullName: "x",
          billingType: "Fixed rate",
          fixedRateTotalAmount: "1",
        },
        counsel: {},
      }),
    ).toThrow(/type is required/);
  });

  it("throws when fullName is missing", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(
        APPLICATION_ID,
        makePriorAuthority({
          billingType: "Fixed rate",
          fixedRateTotalAmount: "1",
        }),
      ),
    ).toThrow(/fullName is required/);
  });

  it("throws when hourly fields are missing", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(
        APPLICATION_ID,
        makePriorAuthority({
          fullName: "x",
          billingType: "Hourly",
        }),
      ),
    ).toThrow(/hourlyRate is required/);
  });

  it("throws when fixed-rate amount is missing", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(
        APPLICATION_ID,
        makePriorAuthority({
          fullName: "x",
          billingType: "Fixed rate",
        }),
      ),
    ).toThrow(/totalAmount is required/);
  });

  it("throws when hourlyRate is not numeric", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(
        APPLICATION_ID,
        makePriorAuthority({
          fullName: "x",
          billingType: "Hourly",
          hourlyRate: "not-a-number",
          estimatedTime: { estimatedHours: "1", estimatedMinutes: "0" },
          totalAmount: "1",
        }),
      ),
    ).toThrow(/hourlyRate is not a valid number/);
  });

  it("throws when hours is not a whole number", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(
        APPLICATION_ID,
        makePriorAuthority({
          fullName: "x",
          billingType: "Hourly",
          hourlyRate: "50",
          estimatedTime: { estimatedHours: "1.5", estimatedMinutes: "0" },
          totalAmount: "75",
        }),
      ),
    ).toThrow(/timeHours must be a whole number/);
  });
});
