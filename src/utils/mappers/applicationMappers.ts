import type { ApplicationSummary } from "#src/types/applications.js";

const formatStatus = (statusString: string): string => {
  const statusMap: Record<string, [string, string]> = {
    APPLICATION_IN_PROGRESS: ["In progress", "red"],
    APPLICATION_SUBMITTED: ["Submitted", "green"],
    APPLICATION_APPROVED: ["Granted", "green"],
    APPLICATION_REJECTED: ["Refused", "red"],
  };

  const status = statusMap[statusString];

  return `<strong class="govuk-tag govuk-tag--${status[1]}">${status[0]}</strong>`;
};

export const toApplicationTableRows = (
  applications: ApplicationSummary[],
): Array<Array<{ text: string } | { html: string }>> =>
  applications.map((application) => [
    { text: `${application.clientFirstName} ${application.clientLastName}` },
    {
      text: new Date(application.submittedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    },
    { text: application.laaReference },
    { html: formatStatus(application.status) },
    {
      html: `<a class="govuk-link" href="/applications/${application.applicationId}">View</a>`,
    },
  ]);
