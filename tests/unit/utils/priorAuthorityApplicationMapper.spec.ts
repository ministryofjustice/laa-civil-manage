import { mapPriorAuthorityToApplicationRequest } from "#src/utils/mappers/priorAuthorityApplicationMapper.js";
import type { PriorAuthority } from "#src/types/priorAuthority/shared.js";
import { describe, expect, it } from "bun:test";

const APPLICATION_ID = "5f1b2c3d-1111-2222-3333-444455556666";
const LAA_REFERENCE = "LAA-123456";

type Expert = PriorAuthority["expert"];

const makePriorAuthority = (
  expert: Expert,
  type: PriorAuthority["type"] = "Expert",
): PriorAuthority => ({
  type,
  expert,
  counsel: {},
  disbursement: {},
});

const fixedRateExpert = (overrides: Expert = {}): Expert => ({
  expertType: "Psychologist",
  fullName: "Dr Jane Smith",
  expertPostcode: "SW1H 9AJ",
  billingType: "Fixed rate",
  fixedRateTotalAmount: "249.99",
  costsSharedWithOtherParties: "No",
  ...overrides,
});

const hourlyExpert = (overrides: Expert = {}): Expert => ({
  expertType: "Psychologist",
  fullName: "Dr Jane Smith",
  expertPostcode: "SW1H 9AJ",
  billingType: "Hourly",
  hourlyRate: "90",
  estimatedTime: { estimatedHours: "2", estimatedMinutes: "30" },
  totalAmount: "225",
  costsSharedWithOtherParties: "No",
  ...overrides,
});

const sharedCosts = {
  costsSharedWithOtherParties: "Yes",
  numberOfParties: "4",
  apportionedAmount: "31.25",
} satisfies Expert;

const counselPriorAuthority = (
  counsel: PriorAuthority["counsel"],
): PriorAuthority => ({
  type: "Counsel",
  expert: {},
  counsel,
  disbursement: {},
});

const disbursementPriorAuthority = (
  disbursement: PriorAuthority["disbursement"],
): PriorAuthority => ({
  type: "Disbursement",
  expert: {},
  counsel: {},
  disbursement,
});

describe("mapPriorAuthorityToApplicationRequest", () => {
  it("maps a full hourly submission into the nested API request shape", () => {
    const result = mapPriorAuthorityToApplicationRequest(
      APPLICATION_ID,
      LAA_REFERENCE,
      makePriorAuthority(
        hourlyExpert({
          justification: "test justification",
          uploadedDocuments: [
            { fileName: "abc.pdf", originalFileName: "Medical Report.pdf" },
          ],
        }),
      ),
    );

    expect(result).toEqual({
      applicationId: APPLICATION_ID,
      laaReference: LAA_REFERENCE,
      priorAuthorityType: "EXPERT",
      justification: "test justification",
      uploadedDocuments: [{ fileName: "abc.pdf" }],
      expertDetails: {
        expertType: "Psychologist",
        expertFullName: "Dr Jane Smith",
        expertPostcode: "SW1H 9AJ",
        expertCosts: {
          billingType: "HOURLY",
          hourlyRate: 90,
          timeRequested: { hours: 2, minutes: 30 },
          totalAmount: 225,
          costsSharedWithOtherParties: false,
          apportionment: undefined,
        },
      },
    });
  });

  it("maps a flat-rate submission and omits the hourly fields", () => {
    const result = mapPriorAuthorityToApplicationRequest(
      APPLICATION_ID,
      LAA_REFERENCE,
      makePriorAuthority(fixedRateExpert()),
    );

    expect(result.expertDetails?.expertCosts).toEqual({
      billingType: "FIXED_RATE",
      totalAmount: 249.99,
      costsSharedWithOtherParties: false,
      apportionment: undefined,
    });
    expect(result.expertDetails?.expertCosts.hourlyRate).toBeUndefined();
    expect(result.expertDetails?.expertCosts.timeRequested).toBeUndefined();
  });

  it("maps shared costs into the apportionment block", () => {
    const result = mapPriorAuthorityToApplicationRequest(
      APPLICATION_ID,
      LAA_REFERENCE,
      makePriorAuthority(fixedRateExpert(sharedCosts)),
    );

    expect(result.expertDetails?.expertCosts.costsSharedWithOtherParties).toBe(
      true,
    );
    expect(result.expertDetails?.expertCosts.apportionment).toEqual({
      partiesSharingCosts: 4,
      clientShareAmount: 31.25,
    });
  });

  it("omits apportionment entirely when costs are not shared", () => {
    const result = mapPriorAuthorityToApplicationRequest(
      APPLICATION_ID,
      LAA_REFERENCE,
      makePriorAuthority(fixedRateExpert()),
    );

    expect(result.expertDetails?.expertCosts.costsSharedWithOtherParties).toBe(
      false,
    );
    expect(result.expertDetails?.expertCosts.apportionment).toBeUndefined();
  });

  it("sends no counsel or disbursement block on an expert request", () => {
    const result = mapPriorAuthorityToApplicationRequest(
      APPLICATION_ID,
      LAA_REFERENCE,
      makePriorAuthority(fixedRateExpert()),
    );

    expect(result.counselDetails).toBeUndefined();
    expect(result.disbursementDetails).toBeUndefined();
  });

  it("maps a counsel submission from the counsel session section", () => {
    const result = mapPriorAuthorityToApplicationRequest(
      APPLICATION_ID,
      LAA_REFERENCE,
      counselPriorAuthority({
        counselType: "KINGS_COUNSEL_ALONE",
        justification: "counsel justification",
        uploadedDocuments: [
          { fileName: "abc.pdf", originalFileName: "Advice.pdf" },
        ],
      }),
    );

    expect(result).toEqual({
      applicationId: APPLICATION_ID,
      laaReference: LAA_REFERENCE,
      priorAuthorityType: "COUNSEL",
      justification: "counsel justification",
      uploadedDocuments: [{ fileName: "abc.pdf" }],
      counselDetails: { counselType: "KINGS_COUNSEL_ALONE" },
    });
  });

  it("sends no expert block on a counsel request", () => {
    const result = mapPriorAuthorityToApplicationRequest(
      APPLICATION_ID,
      LAA_REFERENCE,
      counselPriorAuthority({ counselType: "TWO_JUNIOR_COUNSEL" }),
    );

    expect(result.expertDetails).toBeUndefined();
    expect(result.disbursementDetails).toBeUndefined();
  });

  it("maps the type enum to the API casing", () => {
    const expert = mapPriorAuthorityToApplicationRequest(
      APPLICATION_ID,
      LAA_REFERENCE,
      makePriorAuthority(fixedRateExpert(), "Expert"),
    );
    const counsel = mapPriorAuthorityToApplicationRequest(
      APPLICATION_ID,
      LAA_REFERENCE,
      counselPriorAuthority({ counselType: "KINGS_COUNSEL_ALONE" }),
    );

    expect(expert.priorAuthorityType).toBe("EXPERT");
    expect(counsel.priorAuthorityType).toBe("COUNSEL");
  });

  it("maps a disbursement submission from the disbursement session section", () => {
    const result = mapPriorAuthorityToApplicationRequest(
      APPLICATION_ID,
      LAA_REFERENCE,
      disbursementPriorAuthority({
        disbursementPurpose: "Medical records request",
        disbursementAmount: "150.50",
        justification: "disbursement justification",
        uploadedDocuments: [
          { fileName: "abc.pdf", originalFileName: "Invoice.pdf" },
        ],
      }),
    );

    expect(result).toEqual({
      applicationId: APPLICATION_ID,
      laaReference: LAA_REFERENCE,
      priorAuthorityType: "DISBURSEMENT",
      justification: "disbursement justification",
      uploadedDocuments: [{ fileName: "abc.pdf" }],
      disbursementDetails: {
        disbursementPurpose: "Medical records request",
        disbursementAmount: 150.5,
      },
    });
  });

  it("sends no expert or counsel block on a disbursement request", () => {
    const result = mapPriorAuthorityToApplicationRequest(
      APPLICATION_ID,
      LAA_REFERENCE,
      disbursementPriorAuthority({
        disbursementPurpose: "Medical records request",
        disbursementAmount: "150.50",
      }),
    );

    expect(result.expertDetails).toBeUndefined();
    expect(result.counselDetails).toBeUndefined();
  });

  it("throws when disbursementPurpose is missing", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(
        APPLICATION_ID,
        LAA_REFERENCE,
        disbursementPriorAuthority({ disbursementAmount: "150.50" }),
      ),
    ).toThrow(/disbursementPurpose is required/);
  });

  it("throws when disbursementAmount is missing", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(
        APPLICATION_ID,
        LAA_REFERENCE,
        disbursementPriorAuthority({
          disbursementPurpose: "Medical records request",
        }),
      ),
    ).toThrow(/disbursementAmount is required/);
  });

  it("strips originalFileName from uploaded documents", () => {
    const result = mapPriorAuthorityToApplicationRequest(
      APPLICATION_ID,
      LAA_REFERENCE,
      makePriorAuthority(
        fixedRateExpert({
          uploadedDocuments: [
            { fileName: "a", originalFileName: "A.pdf" },
            { fileName: "b", originalFileName: "B.pdf" },
          ],
        }),
      ),
    );

    expect(result.uploadedDocuments).toEqual([
      { fileName: "a" },
      { fileName: "b" },
    ]);
  });

  it("throws when type is missing", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(APPLICATION_ID, LAA_REFERENCE, {
        expert: fixedRateExpert(),
        counsel: {},
        disbursement: {},
      }),
    ).toThrow(/type is required/);
  });

  it("throws when expertType is missing", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(
        APPLICATION_ID,
        LAA_REFERENCE,
        makePriorAuthority(fixedRateExpert({ expertType: undefined })),
      ),
    ).toThrow(/expertType is required/);
  });

  it("throws when fullName is missing", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(
        APPLICATION_ID,
        LAA_REFERENCE,
        makePriorAuthority(fixedRateExpert({ fullName: undefined })),
      ),
    ).toThrow(/fullName is required/);
  });

  it("throws when expertPostcode is missing", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(
        APPLICATION_ID,
        LAA_REFERENCE,
        makePriorAuthority(fixedRateExpert({ expertPostcode: undefined })),
      ),
    ).toThrow(/expertPostcode is required/);
  });

  it("throws when billingType is missing", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(
        APPLICATION_ID,
        LAA_REFERENCE,
        makePriorAuthority(fixedRateExpert({ billingType: undefined })),
      ),
    ).toThrow(/billingType is required/);
  });

  it("throws when it is unknown whether costs are shared", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(
        APPLICATION_ID,
        LAA_REFERENCE,
        makePriorAuthority(
          fixedRateExpert({ costsSharedWithOtherParties: undefined }),
        ),
      ),
    ).toThrow(/costsSharedWithOtherParties is required/);
  });

  it("throws when counselType is missing", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(
        APPLICATION_ID,
        LAA_REFERENCE,
        counselPriorAuthority({}),
      ),
    ).toThrow(/counselType is required/);
  });

  it("throws when apportionment fields are missing but costs are shared", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(
        APPLICATION_ID,
        LAA_REFERENCE,
        makePriorAuthority(
          fixedRateExpert({ costsSharedWithOtherParties: "Yes" }),
        ),
      ),
    ).toThrow(/partiesSharingCosts is required/);
  });

  it("throws when the hourly rate is missing", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(
        APPLICATION_ID,
        LAA_REFERENCE,
        makePriorAuthority(hourlyExpert({ hourlyRate: undefined })),
      ),
    ).toThrow(/hourlyRate is required/);
  });

  it("throws when fixed-rate amount is missing", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(
        APPLICATION_ID,
        LAA_REFERENCE,
        makePriorAuthority(
          fixedRateExpert({ fixedRateTotalAmount: undefined }),
        ),
      ),
    ).toThrow(/totalAmount is required/);
  });

  it("throws when hourlyRate is not numeric", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(
        APPLICATION_ID,
        LAA_REFERENCE,
        makePriorAuthority(hourlyExpert({ hourlyRate: "not-a-number" })),
      ),
    ).toThrow(/hourlyRate is not a valid number/);
  });

  it("throws when hours is not a whole number", () => {
    expect(() =>
      mapPriorAuthorityToApplicationRequest(
        APPLICATION_ID,
        LAA_REFERENCE,
        makePriorAuthority(
          hourlyExpert({
            estimatedTime: { estimatedHours: "1.5", estimatedMinutes: "0" },
          }),
        ),
      ),
    ).toThrow(/hours must be a whole number/);
  });
});
