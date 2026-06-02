import { mapPriorAuthorityToApplicationRequest } from "#src/utils/mappers/priorAuthorityApplicationMapper.js";
import type { PriorAuthority } from "#src/types/prior-authority.js";
import { describe, expect, it } from "bun:test";

const APPLICATION_ID = "5f1b2c3d-1111-2222-3333-444455556666";

describe("mapPriorAuthorityToApplicationRequest", () => {
  it("maps a full hourly submission into the API request shape", () => {
    const priorAuthority: Partial<PriorAuthority> = {
      type: "Expert",
      expertType: "Psychologist",
      fullName: "Dr Jane Smith",
      uploadedDocuments: [
        { fileName: "abc.pdf", originalFileName: "Medical Report.pdf" },
      ],
      guidelineRatesExceeded: "Yes",
      billingType: "Hourly",
      hourlyRate: "90",
      estimatedTime: { estimatedHours: "2", estimatedMinutes: "30" },
      totalAmount: "225",
    };

    const result = mapPriorAuthorityToApplicationRequest(
      APPLICATION_ID,
      priorAuthority,
    );

    expect(result).toEqual({
      applicationId: APPLICATION_ID,
      type: "EXPERT",
      expertType: "Psychologist",
      expertFullName: "Dr Jane Smith",
      uploadedDocuments: [{ fileName: "abc.pdf" }],
      guidelineRatesExceeded: true,
      billingType: "HOURLY",
      hourlyRate: 90,
      estimatedTime: { hours: 2, minutes: 30 },
      totalAmount: 225,
    });
  });

  it("maps a flat-rate submission and omits hourly fields", () => {
    const result = mapPriorAuthorityToApplicationRequest(APPLICATION_ID, {
      type: "Expert",
      expertType: "Psychologist",
      fullName: "Dr Jane Smith",
      guidelineRatesExceeded: "No",
      billingType: "Fixed cost",
      flatRateTotalAmount: "249.99",
    });

    expect(result).toEqual({
      applicationId: APPLICATION_ID,
      type: "EXPERT",
      expertType: "Psychologist",
      expertFullName: "Dr Jane Smith",
      uploadedDocuments: undefined,
      guidelineRatesExceeded: false,
      billingType: "FLAT_RATE",
      flatRateTotalAmount: 249.99,
    });
  });

  it("maps the type enum to the API casing", () => {
    const expert = mapPriorAuthorityToApplicationRequest(APPLICATION_ID, {
      type: "Expert",
      fullName: "x",
      billingType: "Fixed cost",
      flatRateTotalAmount: "1",
    });
    const disbursement = mapPriorAuthorityToApplicationRequest(APPLICATION_ID, {
      type: "Disbursement",
      fullName: "x",
      billingType: "Fixed cost",
      flatRateTotalAmount: "1",
    });
    const counsel = mapPriorAuthorityToApplicationRequest(APPLICATION_ID, {
      type: "Counsel",
      fullName: "x",
      billingType: "Fixed cost",
      flatRateTotalAmount: "1",
    });

    expect(expert.type).toBe("EXPERT");
    expect(disbursement.type).toBe("DISBURSEMENT");
    expect(counsel.type).toBe("COUNSEL");
  });

  it("strips originalFileName from uploaded documents", () => {
    const result = mapPriorAuthorityToApplicationRequest(APPLICATION_ID, {
      type: "Expert",
      fullName: "x",
      uploadedDocuments: [
        { fileName: "a", originalFileName: "A.pdf" },
        { fileName: "b", originalFileName: "B.pdf" },
      ],
      billingType: "Fixed cost",
      flatRateTotalAmount: "1",
    });

    expect(result.uploadedDocuments).toEqual([
      { fileName: "a" },
      { fileName: "b" },
    ]);
  });

  it("throws when type is missing", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(APPLICATION_ID, {
        fullName: "x",
        billingType: "Fixed cost",
        flatRateTotalAmount: "1",
      }),
    ).toThrow(/type is required/);
  });

  it("throws when fullName is missing", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(APPLICATION_ID, {
        type: "Expert",
        billingType: "Fixed cost",
        flatRateTotalAmount: "1",
      }),
    ).toThrow(/fullName is required/);
  });

  it("throws when hourly fields are missing", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(APPLICATION_ID, {
        type: "Expert",
        fullName: "x",
        billingType: "Hourly",
      }),
    ).toThrow(/hourlyRate is required/);
  });

  it("throws when flat-rate amount is missing", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(APPLICATION_ID, {
        type: "Expert",
        fullName: "x",
        billingType: "Fixed cost",
      }),
    ).toThrow(/flatRateTotalAmount is required/);
  });

  it("throws when hourlyRate is not numeric", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(APPLICATION_ID, {
        type: "Expert",
        fullName: "x",
        billingType: "Hourly",
        hourlyRate: "not-a-number",
        estimatedTime: { estimatedHours: "1", estimatedMinutes: "0" },
        totalAmount: "1",
      }),
    ).toThrow(/hourlyRate is not a valid number/);
  });

  it("throws when hours is not a whole number", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(APPLICATION_ID, {
        type: "Expert",
        fullName: "x",
        billingType: "Hourly",
        hourlyRate: "50",
        estimatedTime: { estimatedHours: "1.5", estimatedMinutes: "0" },
        totalAmount: "75",
      }),
    ).toThrow(/estimatedTime\.hours must be a whole number/);
  });
});
