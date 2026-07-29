import type { counselType } from "#src/types/priorAuthority/counsel.js";
import type { PriorAuthority } from "#src/types/priorAuthority/shared.js";

interface SummaryValue {
  text?: string;
  html?: string;
}

interface SummaryAction {
  href: string;
  text: string;
  classes: string;
  visuallyHiddenText: string;
}

interface SummaryRow {
  classes?: string;
  key?: { text: string };
  value: SummaryValue;
  actions?: { items: SummaryAction[] };
}

export interface SummaryCard {
  classes?: string;
  card: {
    title: { text: string };
    actions?: { items: SummaryAction[] };
  };
  rows: SummaryRow[];
}

const NOT_PROVIDED = "Not provided";

export const COUNSEL_TYPE_LABELS: Record<counselType, string> = {
  KINGS_COUNSEL_ALONE: "King's Counsel alone",
  TWO_JUNIOR_COUNSEL: "Two Junior Counsel",
  KINGS_COUNSEL_AND_JUNIOR_COUNSEL: "King's Counsel and Junior Counsel",
  KINGS_COUNSEL_AND_TWO_JUNIOR_COUNSEL: "King's Counsel and Two Junior Counsel",
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const changeAction = (
  href: string,
  visuallyHiddenText: string,
): { items: SummaryAction[] } => ({
  items: [
    {
      href,
      text: "Change",
      classes: "govuk-link--no-visited-state",
      visuallyHiddenText,
    },
  ],
});

const justificationCard = (
  justification: string | undefined,
  basePath: string,
): SummaryCard => {
  const html = `<div class="govuk-grid-row">
      <div class="govuk-grid-column-three-quarters-from-desktop">
        <p class="govuk-body govuk-!-margin-bottom-0">${escapeHtml(
          justification || NOT_PROVIDED,
        )}</p>
      </div>
    </div>`;

  return {
    classes: "pa-justification-summary-list",
    card: {
      title: { text: "Justification" },
      actions: changeAction(`${basePath}/justification`, "justification"),
    },
    rows: [{ value: { html } }],
  };
};

const documentsCard = (
  uploadedDocuments: PriorAuthority["expert"]["uploadedDocuments"],
  basePath: string,
): SummaryCard => {
  const hasDocs = Boolean(uploadedDocuments?.length);
  const value: SummaryValue = hasDocs
    ? {
        html: `<ul class="govuk-list govuk-!-margin-bottom-0">${(
          uploadedDocuments ?? []
        )
          .map((doc) => `<li>${escapeHtml(doc.originalFileName)}</li>`)
          .join("")}</ul>`,
      }
    : { text: NOT_PROVIDED };

  return {
    card: {
      title: { text: "Supporting documents" },
      actions: changeAction(
        `${basePath}/document-upload`,
        "supporting documents",
      ),
    },
    rows: [{ key: { text: "File names" }, value }],
  };
};

const expertDetailsCard = (
  expert: PriorAuthority["expert"],
  basePath: string,
): SummaryCard => ({
  card: { title: { text: "Expert details" } },
  rows: [
    {
      classes: "govuk-summary-list__row--no-border",
      key: { text: "Expert type" },
      value: { text: expert.expertType || NOT_PROVIDED },
      actions: changeAction(`${basePath}/details`, "expert type and full name"),
    },
    {
      key: { text: "Full name" },
      value: { text: expert.fullName || NOT_PROVIDED },
    },
    {
      key: { text: "Guideline rates or hours exceeded" },
      value: { text: expert.guidelineRatesExceeded || NOT_PROVIDED },
      actions: changeAction(
        `${basePath}/is-guideline-rate-exceeded`,
        "guideline rates or hours exceeded",
      ),
    },
    {
      key: { text: "Based in London" },
      value: { text: expert.expertBasedInLondon || NOT_PROVIDED },
      actions: changeAction(`${basePath}/based-in-london`, "based in London"),
    },
  ],
});

const formatTimeUnit = (
  value: string | undefined,
  singular: string,
  plural: string,
): string => `${value ?? ""} ${value === "1" ? singular : plural}`.trim();

const expertCostsRows = (expert: PriorAuthority["expert"]): SummaryRow[] => {
  const rows: SummaryRow[] = [
    {
      key: { text: "Billing method" },
      value: { text: expert.billingType || NOT_PROVIDED },
    },
  ];

  if (expert.billingType === "Hourly") {
    rows.push({
      key: { text: "Hourly rate" },
      value: {
        text: expert.hourlyRate ? `£${expert.hourlyRate}` : NOT_PROVIDED,
      },
    });
    const hoursText = formatTimeUnit(
      expert.estimatedTime?.estimatedHours,
      "Hour",
      "Hours",
    );
    const minutesText = formatTimeUnit(
      expert.estimatedTime?.estimatedMinutes,
      "Minute",
      "Minutes",
    );
    rows.push({
      key: { text: "Time requested" },
      value: {
        html: `${escapeHtml(hoursText)} <br>${escapeHtml(minutesText)}`,
      },
    });
    rows.push({
      key: { text: "Total amount" },
      value: { text: `£${expert.totalAmount ?? NOT_PROVIDED}` },
    });
  } else if (expert.billingType === "Fixed rate") {
    rows.push({
      key: { text: "Total amount" },
      value: { text: `£${expert.fixedRateTotalAmount ?? NOT_PROVIDED}` },
    });
  }

  return rows;
};

const expertCostsCard = (
  expert: PriorAuthority["expert"],
  basePath: string,
): SummaryCard => ({
  card: {
    title: { text: "Expert costs" },
    actions: changeAction(`${basePath}/costs`, "expert costs"),
  },
  rows: expertCostsRows(expert),
});

const counselTypeCard = (
  counsel: PriorAuthority["counsel"],
  basePath: string,
): SummaryCard => {
  const label = counsel.counselType
    ? COUNSEL_TYPE_LABELS[counsel.counselType]
    : NOT_PROVIDED;

  return {
    card: {
      title: { text: "Counsel type" },
      actions: changeAction(`${basePath}/type`, "counsel type"),
    },
    rows: [{ key: { text: "Counsel type" }, value: { text: label } }],
  };
};

export function buildExpertSummaryCards(
  expert: PriorAuthority["expert"],
  basePath: string,
): SummaryCard[] {
  return [
    expertDetailsCard(expert, basePath),
    expertCostsCard(expert, basePath),
    justificationCard(expert.justification, basePath),
    documentsCard(expert.uploadedDocuments, basePath),
  ];
}

export function buildCounselSummaryCards(
  counsel: PriorAuthority["counsel"],
  basePath: string,
): SummaryCard[] {
  return [
    counselTypeCard(counsel, basePath),
    justificationCard(counsel.justification, basePath),
    documentsCard(counsel.uploadedDocuments, basePath),
  ];
}
