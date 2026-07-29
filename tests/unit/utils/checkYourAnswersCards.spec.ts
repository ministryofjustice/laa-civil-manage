import {
  buildCounselSummaryCards,
  buildExpertSummaryCards,
} from "#src/utils/priorAuthority/checkYourAnswersCards.js";
import type { PriorAuthority } from "#src/types/priorAuthority/shared.js";
import { describe, expect, it } from "bun:test";

const EXPERT_BASE = "/prior-authority/expert";
const COUNSEL_BASE = "/prior-authority/counsel";

describe("buildCounselSummaryCards", () => {
  it("builds counsel type, justification and documents cards", () => {
    const counsel: PriorAuthority["counsel"] = {
      counselType: "KINGS_COUNSEL_ALONE",
      justification: "Specialised counsel is required.",
      uploadedDocuments: [
        { fileName: "abc", originalFileName: "brief.pdf" },
      ],
    };

    const cards = buildCounselSummaryCards(counsel, COUNSEL_BASE);

    expect(cards).toHaveLength(3);
    expect(cards[0].card.title.text).toBe("Counsel type");
    expect(cards[0].rows[0].value.text).toBe("King's Counsel alone");
    expect(cards[0].card.actions?.items[0].href).toBe(
      "/prior-authority/counsel/type",
    );

    expect(cards[1].card.title.text).toBe("Justification");
    expect(cards[1].rows[0].value.html).toContain(
      "Specialised counsel is required.",
    );

    expect(cards[2].card.title.text).toBe("Supporting documents");
    expect(cards[2].rows[0].value.html).toContain("brief.pdf");
    expect(cards[2].card.actions?.items[0].href).toBe(
      "/prior-authority/counsel/document-upload",
    );
  });

  it("falls back to Not provided and escapes user content", () => {
    const counsel: PriorAuthority["counsel"] = {
      justification: "<script>alert(1)</script>",
    };

    const cards = buildCounselSummaryCards(counsel, COUNSEL_BASE);

    expect(cards[0].rows[0].value.text).toBe("Not provided");
    expect(cards[1].rows[0].value.html).toContain("&lt;script&gt;");
    expect(cards[1].rows[0].value.html).not.toContain("<script>");
    expect(cards[2].rows[0].value.text).toBe("Not provided");
  });
});

describe("buildExpertSummaryCards", () => {
  it("builds fixed rate cards with resolved values and change links", () => {
    const expert: PriorAuthority["expert"] = {
      expertType: "Dentist",
      fullName: "John Doe",
      guidelineRatesExceeded: "Yes",
      expertBasedInLondon: "No",
      billingType: "Fixed rate",
      fixedRateTotalAmount: "200",
      justification: "Expert evidence is required.",
      uploadedDocuments: [{ fileName: "x", originalFileName: "report.pdf" }],
    };

    const cards = buildExpertSummaryCards(expert, EXPERT_BASE);

    expect(cards).toHaveLength(4);
    expect(cards[0].card.title.text).toBe("Expert details");
    expect(cards[0].rows[0].value.text).toBe("Dentist");
    expect(cards[0].rows[1].value.text).toBe("John Doe");

    expect(cards[1].card.title.text).toBe("Expert costs");
    expect(cards[1].rows[0].value.text).toBe("Fixed rate");
    expect(cards[1].rows[1].value.text).toBe("£200");
  });

  it("builds hourly billing rows with formatted time", () => {
    const expert: PriorAuthority["expert"] = {
      billingType: "Hourly",
      hourlyRate: "150",
      estimatedTime: { estimatedHours: "1", estimatedMinutes: "30" },
      totalAmount: "375.00",
    };

    const cards = buildExpertSummaryCards(expert, EXPERT_BASE);
    const costsRows = cards[1].rows;

    expect(costsRows[0].value.text).toBe("Hourly");
    expect(costsRows[1].value.text).toBe("£150");
    expect(costsRows[2].value.html).toContain("1 Hour");
    expect(costsRows[2].value.html).toContain("30 Minutes");
    expect(costsRows[3].value.text).toBe("£375.00");
  });
});

