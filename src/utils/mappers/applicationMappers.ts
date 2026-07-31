import type { ApplicationSummary } from "#src/types/applications.js";

type TableCell =
  | { text: string; attributes?: Record<string, string> }
  | { html: string; attributes?: Record<string, string> };

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
      html: `<a class="govuk-link" href="/applications/manage/${application.applicationId}">Manage</a>`,
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
    // TODO - This is a temporary fix until we have the correct matter type from ADS, Note for MVP we are only showing Special Children Act matter type
    value: { text: "Special Children Act" },
  },
];
