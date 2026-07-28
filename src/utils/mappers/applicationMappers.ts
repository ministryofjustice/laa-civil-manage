import type { ApplicationSummary } from "#src/types/applications.js";

type TableCell =
  | { text: string; attributes?: Record<string, string> }
  | { html: string; attributes?: Record<string, string> };

// TODO update colours when we have the final designs for the status tags
// TODO update the status mapping when we have the final list of statuses from the API we currently don't have approved and rejected statuses in the API response, so we are using the submitted status for now
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

const formatClientName = (
  clientFirstName: string | null | undefined,
  clientLastName: string | null | undefined,
): string => {
  const name = `${clientFirstName ?? ""} ${clientLastName ?? ""}`.trim();
  return name || "No access to data";
};

export const toApplicationTableRows = (
  applications: ApplicationSummary[],
): TableCell[][] =>
  applications.map((application) => [
    {
      text: formatClientName(
        application.clientFirstName,
        application.clientLastName,
      ),
    },
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
      html:
        application.status === "APPLICATION_IN_PROGRESS"
          ? `<a class="govuk-link" href="/applications/view/${application.applicationId}">View</a>`
          : `<a class="govuk-link" href="/applications/manage/${application.applicationId}">Manage</a>`,
    },
  ]);

export const toApplicationSummaryRows = (
  application: ApplicationSummary,
): Array<{
  key: { text: string };
  value: { text?: string; html?: string };
}> => [
  {
    key: { text: "Client" },
    value: {
      text: formatClientName(
        application.clientFirstName,
        application.clientLastName,
      ),
    },
  },
  { key: { text: "LAA reference" }, value: { text: application.laaReference } },
  {
    key: { text: "Matter type" },
    value: { text: application.matterType || "No access to data" },
  },
  {
    key: { text: "Status" },
    value: { html: formatStatus(application.status) },
  },
];
