import { describe, expect, it } from "bun:test";
import {
  buildCounselDraftDto,
  buildDisbursementDraftDto,
  buildExpertDraftDto,
  buildPriorAuthorityDraftDto,
  hydrateCounselViewModel,
  hydrateDisbursementViewModel,
  hydrateExpertViewModel,
  hydratePriorAuthority,
} from "#src/utils/mappers/priorAuthorityDraftMapper.js";

const APPLICATION_ID = "APP-1001";

describe("buildExpertDraftDto", () => {
  it("omits unset fields rather than filling them with placeholders", () => {
    const result = buildExpertDraftDto(APPLICATION_ID, {});

    expect(result).toEqual({
      applicationId: APPLICATION_ID,
      priorAuthorityType: "EXPERT",
      justification: undefined,
      expertDetails: {
        expertType: undefined,
        expertFullName: undefined,
        expertPostcode: undefined,
        expertCosts: undefined,
      },
    });
  });

  it("builds hourly costs once billing type and shared fields are present", () => {
    const result = buildExpertDraftDto(APPLICATION_ID, {
      expertType: "Dentist",
      fullName: "Dr Example",
      expertPostcode: "AB1 2CD",
      billingType: "Hourly",
      hourlyRate: "90",
      estimatedTime: { estimatedHours: "2", estimatedMinutes: "30" },
      totalAmount: "225",
      costsSharedWithOtherParties: "Yes",
      numberOfParties: "3",
      apportionedAmount: "75",
      justification: "Because it is needed",
    });

    expect(result).toEqual({
      applicationId: APPLICATION_ID,
      priorAuthorityType: "EXPERT",
      justification: "Because it is needed",
      expertDetails: {
        expertType: "Dentist",
        expertFullName: "Dr Example",
        expertPostcode: "AB1 2CD",
        expertCosts: {
          billingType: "HOURLY",
          hourlyRate: 90,
          timeRequested: { hours: 2, minutes: 30 },
          totalAmount: 225,
          costsSharedWithOtherParties: true,
          apportionment: { partiesSharingCosts: 3, clientShareAmount: 75 },
        },
      },
    });
  });

  it("does not build apportionment when costs are not shared", () => {
    const result = buildExpertDraftDto(APPLICATION_ID, {
      billingType: "Fixed rate",
      fixedRateTotalAmount: "500",
      costsSharedWithOtherParties: "No",
    });

    expect(result.expertDetails?.expertCosts).toEqual({
      billingType: "FIXED_RATE",
      totalAmount: 500,
      costsSharedWithOtherParties: false,
      apportionment: undefined,
    });
  });

  it("omits apportionment when its sub-fields cannot be parsed yet", () => {
    const result = buildExpertDraftDto(APPLICATION_ID, {
      billingType: "Hourly",
      costsSharedWithOtherParties: "Yes",
    });

    expect(result.expertDetails?.expertCosts?.apportionment).toBeUndefined();
  });
});

describe("buildCounselDraftDto", () => {
  it("maps counsel fields", () => {
    const result = buildCounselDraftDto(APPLICATION_ID, {
      counselType: "KINGS_COUNSEL_ALONE",
      justification: "Because it is needed",
    });

    expect(result).toEqual({
      applicationId: APPLICATION_ID,
      priorAuthorityType: "COUNSEL",
      justification: "Because it is needed",
      counselDetails: { counselType: "KINGS_COUNSEL_ALONE" },
    });
  });

  it("omits unset fields rather than filling them with placeholders", () => {
    const result = buildCounselDraftDto(APPLICATION_ID, {});

    expect(result).toEqual({
      applicationId: APPLICATION_ID,
      priorAuthorityType: "COUNSEL",
      justification: undefined,
      counselDetails: { counselType: undefined },
    });
  });
});

describe("buildDisbursementDraftDto", () => {
  it("maps disbursement fields and parses the amount", () => {
    const result = buildDisbursementDraftDto(APPLICATION_ID, {
      disbursementPurpose: "Medical records request",
      disbursementAmount: "150.50",
      justification: "Because it is needed",
    });

    expect(result).toEqual({
      applicationId: APPLICATION_ID,
      priorAuthorityType: "DISBURSEMENT",
      justification: "Because it is needed",
      disbursementDetails: {
        disbursementPurpose: "Medical records request",
        disbursementAmount: 150.5,
      },
    });
  });

  it("omits the amount when it cannot be parsed yet", () => {
    const result = buildDisbursementDraftDto(APPLICATION_ID, {
      disbursementPurpose: "Medical records request",
    });

    expect(result.disbursementDetails?.disbursementAmount).toBeUndefined();
  });
});

describe("buildPriorAuthorityDraftDto", () => {
  it("dispatches to the expert builder by default", () => {
    const result = buildPriorAuthorityDraftDto(APPLICATION_ID, {
      expert: { expertType: "Dentist" },
      counsel: {},
      disbursement: {},
    });

    expect(result.priorAuthorityType).toBe("EXPERT");
  });

  it("dispatches to the counsel builder", () => {
    const result = buildPriorAuthorityDraftDto(APPLICATION_ID, {
      type: "Counsel",
      expert: {},
      counsel: { counselType: "KINGS_COUNSEL_ALONE" },
      disbursement: {},
    });

    expect(result.priorAuthorityType).toBe("COUNSEL");
  });

  it("dispatches to the disbursement builder", () => {
    const result = buildPriorAuthorityDraftDto(APPLICATION_ID, {
      type: "Disbursement",
      expert: {},
      counsel: {},
      disbursement: { disbursementPurpose: "Medical records request" },
    });

    expect(result.priorAuthorityType).toBe("DISBURSEMENT");
  });
});

describe("hydrateExpertViewModel", () => {
  it("returns an empty view model when details are absent", () => {
    const result = hydrateExpertViewModel(undefined, undefined);

    expect(result.expertType).toBeUndefined();
    expect(result.billingType).toBeUndefined();
  });

  it("converts strict hourly costs back into loose string fields", () => {
    const result = hydrateExpertViewModel(
      {
        expertType: "Dentist",
        expertFullName: "Dr Example",
        expertPostcode: "AB1 2CD",
        expertCosts: {
          billingType: "HOURLY",
          hourlyRate: 90,
          timeRequested: { hours: 2, minutes: 30 },
          totalAmount: 225,
          costsSharedWithOtherParties: true,
          apportionment: { partiesSharingCosts: 3, clientShareAmount: 75 },
        },
      },
      "Because it is needed",
    );

    expect(result).toEqual({
      expertType: "Dentist",
      fullName: "Dr Example",
      expertPostcode: "AB1 2CD",
      justification: "Because it is needed",
      billingType: "Hourly",
      hourlyRate: "90",
      estimatedTime: { estimatedHours: "2", estimatedMinutes: "30" },
      totalAmount: "225",
      fixedRateTotalAmount: undefined,
      costsSharedWithOtherParties: "Yes",
      numberOfParties: "3",
      apportionedAmount: "75",
    });
  });

  it("converts strict fixed-rate costs back into loose string fields", () => {
    const result = hydrateExpertViewModel(
      {
        expertCosts: {
          billingType: "FIXED_RATE",
          totalAmount: 500,
          costsSharedWithOtherParties: false,
        },
      },
      undefined,
    );

    expect(result.billingType).toBe("Fixed rate");
    expect(result.fixedRateTotalAmount).toBe("500");
    expect(result.totalAmount).toBeUndefined();
    expect(result.costsSharedWithOtherParties).toBe("No");
  });

  it("leaves fields unset when the draft omits them", () => {
    const result = hydrateExpertViewModel(
      {
        expertCosts: {
          billingType: "HOURLY",
          costsSharedWithOtherParties: true,
        },
      },
      undefined,
    );

    expect(result.expertType).toBeUndefined();
    expect(result.fullName).toBeUndefined();
    expect(result.expertPostcode).toBeUndefined();
    expect(result.hourlyRate).toBeUndefined();
    expect(result.estimatedTime).toBeUndefined();
    expect(result.totalAmount).toBeUndefined();
    expect(result.numberOfParties).toBeUndefined();
    expect(result.apportionedAmount).toBeUndefined();
  });
});

describe("hydrateCounselViewModel", () => {
  it("maps counsel details back to the view model", () => {
    const result = hydrateCounselViewModel(
      { counselType: "TWO_JUNIOR_COUNSEL" },
      "Because it is needed",
    );

    expect(result).toEqual({
      counselType: "TWO_JUNIOR_COUNSEL",
      justification: "Because it is needed",
    });
  });

  it("leaves counsel type unset when the draft omits it", () => {
    const result = hydrateCounselViewModel({}, undefined);

    expect(result.counselType).toBeUndefined();
  });
});

describe("hydrateDisbursementViewModel", () => {
  it("maps disbursement details back to the view model, stringifying the amount", () => {
    const result = hydrateDisbursementViewModel(
      {
        disbursementPurpose: "Medical records request",
        disbursementAmount: 150.5,
      },
      "Because it is needed",
    );

    expect(result).toEqual({
      disbursementPurpose: "Medical records request",
      disbursementAmount: "150.5",
      justification: "Because it is needed",
    });
  });

  it("leaves fields unset when the draft omits them", () => {
    const result = hydrateDisbursementViewModel({}, undefined);

    expect(result.disbursementPurpose).toBeUndefined();
    expect(result.disbursementAmount).toBeUndefined();
  });
});

describe("hydratePriorAuthority", () => {
  it("only hydrates the section matching the draft's type", () => {
    const result = hydratePriorAuthority({
      applicationId: APPLICATION_ID,
      priorAuthorityType: "EXPERT",
      justification: "Because it is needed",
      expertDetails: { expertType: "Dentist" },
    });

    expect(result.type).toBe("Expert");
    expect(result.expert.expertType).toBe("Dentist");
    expect(result.expert.justification).toBe("Because it is needed");
    expect(result.counsel.justification).toBeUndefined();
    expect(result.disbursement.justification).toBeUndefined();
  });

  it("leaves justification unset when the draft omits it", () => {
    const result = hydratePriorAuthority({
      applicationId: APPLICATION_ID,
      priorAuthorityType: "EXPERT",
      expertDetails: { expertType: "Dentist" },
    });

    expect(result.expert.justification).toBeUndefined();
  });
});
