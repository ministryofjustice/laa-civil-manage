import type { ApplicationSummary } from "#src/types/applications.js";

type TableCell =
  | { text: string; attributes?: Record<string, string> }
  | { html: string; attributes?: Record<string, string> };

// TODO update colours when we have the final designs for the status tags
const statusMap: Record<string, [string, string]> = {
  APPLICATION_IN_PROGRESS: ["In progress", "red"],
  APPLICATION_SUBMITTED: ["Submitted", "green"],
  APPLICATION_APPROVED: ["Granted", "green"],
  APPLICATION_REJECTED: ["Refused", "red"],
};

const formatStatus = (statusString: string): string => {
  const status = statusMap[statusString];
  return `<strong class="govuk-tag govuk-tag--${status[1]}">${status[0]}</strong>`;
};

export const toApplicationTableRows = (
  applications: ApplicationSummary[],
): TableCell[][] =>
  applications.map((application) => [
    { text: `${application.clientFirstName} ${application.clientLastName}` },
    {
      text: new Date(application.submittedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      attributes: {
        "data-sort-value": String(new Date(application.submittedAt).getTime()),
      },
    },
    { text: application.laaReference },
    {
      html: formatStatus(application.status),
      attributes: { "data-sort-value": statusMap[application.status][0] },
    },
    {
      html: `<a class="govuk-link" href="/applications/${application.applicationId}">View</a>`,
    },
  ]);
