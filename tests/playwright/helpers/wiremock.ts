import type { APIRequestContext } from "@playwright/test";
import { WIREMOCK_ADMIN_URL } from "#tests/playwright/helpers/wiremockConfig.js";

interface WiremockJournalEntry {
  request: {
    method: string;
    url: string;
    body: string;
  };
}

interface WiremockJournal {
  requests: WiremockJournalEntry[];
}

export async function resetWiremockJournal(
  request: APIRequestContext,
): Promise<void> {
  await request.delete(`${WIREMOCK_ADMIN_URL}/requests`);
}

export async function getBackendRequests<TBody = unknown>(
  request: APIRequestContext,
  { method, urlPath }: { method: string; urlPath: string },
): Promise<TBody[]> {
  const response = await request.get(`${WIREMOCK_ADMIN_URL}/requests`);
  const journal = (await response.json()) as WiremockJournal;

  return journal.requests
    .filter(
      (entry) =>
        entry.request.method === method && entry.request.url === urlPath,
    )
    .map((entry) => JSON.parse(entry.request.body) as TBody);
}
