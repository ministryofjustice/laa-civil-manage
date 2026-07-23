import {
  mapPriorAuthorityToDraftBody,
  mapDraftBodyToPriorAuthority,
} from "#src/utils/mappers/priorAuthorityDraftsMapper.js";
import type { PriorAuthority } from "#src/types/priorAuthority/shared.js";
import type { DraftBody } from "#src/types/priorAuthority/draft.js";
import { describe, expect, it } from "bun:test";

const APPLICATION_ID = "5f1b2c3d-1111-2222-3333-444455556666";

describe("priorAuthorityDraftsMapper - counsel justification", () => {
  it("maps the counsel justification into the draft body for a counsel journey", () => {
    const priorAuthority: PriorAuthority = {
      type: "Counsel",
      expert: {},
      counsel: {
        counselType: "KINGS_COUNSEL_ALONE",
        justification: "Specialised counsel is required.",
      },
    };

    const draftBody = mapPriorAuthorityToDraftBody(
      APPLICATION_ID,
      priorAuthority,
    );

    expect(draftBody.priorAuthorityType).toBe("COUNSEL");
    expect(draftBody.counselType).toBe("KINGS_COUNSEL_ALONE");
    expect(draftBody.justification).toBe("Specialised counsel is required.");
  });

  it("still maps the expert justification for an expert journey", () => {
    const priorAuthority: PriorAuthority = {
      type: "Expert",
      expert: {
        fullName: "Dr Jane Smith",
        billingType: "Fixed rate",
        justification: "Expert evidence is required.",
      },
      counsel: {},
    };

    const draftBody = mapPriorAuthorityToDraftBody(
      APPLICATION_ID,
      priorAuthority,
    );

    expect(draftBody.justification).toBe("Expert evidence is required.");
  });

  it("restores the counsel justification from a counsel draft", () => {
    const draftBody: DraftBody = {
      applicationId: APPLICATION_ID,
      priorAuthorityType: "COUNSEL",
      counselType: "KINGS_COUNSEL_AND_JUNIOR_COUNSEL",
      justification: "Specialised counsel is required.",
    };

    const result = mapDraftBodyToPriorAuthority(draftBody);

    expect(result.type).toBe("Counsel");
    expect(result.counsel.counselType).toBe("KINGS_COUNSEL_AND_JUNIOR_COUNSEL");
    expect(result.counsel.justification).toBe(
      "Specialised counsel is required.",
    );
    expect(result.expert.justification).toBeUndefined();
  });

  it("restores the expert justification from an expert draft", () => {
    const draftBody: DraftBody = {
      applicationId: APPLICATION_ID,
      priorAuthorityType: "EXPERT",
      justification: "Expert evidence is required.",
    };

    const result = mapDraftBodyToPriorAuthority(draftBody);

    expect(result.expert.justification).toBe("Expert evidence is required.");
    expect(result.counsel.justification).toBeUndefined();
  });
});
