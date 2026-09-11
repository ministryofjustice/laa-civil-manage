import { expect, type APIRequestContext } from "@playwright/test";
import { WIREMOCK_ADMIN_URL } from "#tests/playwright/helpers/wiremockConfig.js";
import type { PriorAuthorityDraftDto } from "#src/types/priorAuthority/api.js";

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

interface RequestFilter {
  method: string;
  urlPath: string;
}

const registeredMappingIds: string[] = [];

async function registerMapping(mapping: unknown): Promise<string> {
  const response = await fetch(`${WIREMOCK_ADMIN_URL}/mappings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mapping),
  });
  const { id } = (await response.json()) as { id: string };
  registeredMappingIds.push(id);
  return id;
}

export async function resetWiremockJournal(
  request: APIRequestContext,
): Promise<void> {
  await request.delete(`${WIREMOCK_ADMIN_URL}/requests`);
}

export async function stubPriorAuthorityDraftGet(
  priorAuthorityId: string,
  jsonBody: unknown,
): Promise<string> {
  return await registerMapping({
    priority: 1,
    request: {
      method: "GET",
      urlPath: `/prior-authorities/${priorAuthorityId}`,
    },
    response: {
      status: 200,
      headers: { "Content-Type": "application/json" },
      jsonBody,
    },
  });
}

export async function stubDraftGet(
  priorAuthorityId: string,
  draft: PriorAuthorityDraftDto,
): Promise<string> {
  return await stubPriorAuthorityDraftGet(priorAuthorityId, {
    priorAuthorityId,
    status: "PENDING",
    draft,
  });
}

export async function stubPriorAuthorityDraftPutFailure(
  priorAuthorityId: string,
  status: number,
): Promise<string> {
  return await registerMapping({
    priority: 1,
    request: {
      method: "PUT",
      urlPath: `/prior-authorities/${priorAuthorityId}`,
    },
    response: { status },
  });
}

export async function removeStubMapping(mappingId: string): Promise<void> {
  await fetch(`${WIREMOCK_ADMIN_URL}/mappings/${mappingId}`, {
    method: "DELETE",
  });
}

export async function clearRegisteredStubs(): Promise<void> {
  const ids = registeredMappingIds.splice(0);
  await Promise.all(ids.map(removeStubMapping));
}

async function findRequests(
  request: APIRequestContext,
  { method, urlPath }: RequestFilter,
): Promise<WiremockJournalEntry[]> {
  const response = await request.get(`${WIREMOCK_ADMIN_URL}/requests`);
  const journal = (await response.json()) as WiremockJournal;

  return journal.requests.filter(
    (entry) => entry.request.method === method && entry.request.url === urlPath,
  );
}

export async function getBackendRequests<TBody = unknown>(
  request: APIRequestContext,
  filter: RequestFilter,
): Promise<TBody[]> {
  const entries = await findRequests(request, filter);
  return entries.map((entry) => JSON.parse(entry.request.body) as TBody);
}

export async function expectDraftPut(
  request: APIRequestContext,
  priorAuthorityId: string,
): Promise<PriorAuthorityDraftDto> {
  let bodies: PriorAuthorityDraftDto[] = [];

  await expect(async () => {
    bodies = await getBackendRequests<PriorAuthorityDraftDto>(request, {
      method: "PUT",
      urlPath: `/prior-authorities/${priorAuthorityId}`,
    });
    expect(bodies).toHaveLength(1);
  }).toPass();

  return bodies[0];
}

export async function expectDraftPutBody(
  request: APIRequestContext,
  priorAuthorityId: string,
  expected: PriorAuthorityDraftDto,
): Promise<void> {
  const body = await expectDraftPut(request, priorAuthorityId);
  expect(body).toEqual(expected);
}

export async function expectNoDraftPut(
  request: APIRequestContext,
  priorAuthorityId: string,
): Promise<void> {
  const entries = await findRequests(request, {
    method: "PUT",
    urlPath: `/prior-authorities/${priorAuthorityId}`,
  });
  expect(entries).toHaveLength(0);
}

export async function expectDraftCreate(
  request: APIRequestContext,
): Promise<PriorAuthorityDraftDto> {
  let bodies: PriorAuthorityDraftDto[] = [];

  await expect(async () => {
    bodies = await getBackendRequests<PriorAuthorityDraftDto>(request, {
      method: "POST",
      urlPath: "/prior-authorities",
    });
    expect(bodies).toHaveLength(1);
  }).toPass();

  return bodies[0];
}

export async function expectDraftSubmit(
  request: APIRequestContext,
  priorAuthorityId: string,
): Promise<void> {
  await expect(async () => {
    const entries = await findRequests(request, {
      method: "POST",
      urlPath: `/prior-authorities/${priorAuthorityId}/submit`,
    });
    expect(entries).toHaveLength(1);
    expect(entries[0].request.body).toBe("");
  }).toPass();
}

async function withFailingStub(
  registerStub: () => Promise<string>,
  run: () => Promise<void>,
): Promise<void> {
  const mappingId = await registerStub();
  try {
    await run();
  } finally {
    await removeStubMapping(mappingId);
  }
}

export async function withFailingDraftPut(
  priorAuthorityId: string,
  status: number,
  run: () => Promise<void>,
): Promise<void> {
  await withFailingStub(
    async () =>
      await stubPriorAuthorityDraftPutFailure(priorAuthorityId, status),
    run,
  );
}

export async function withFailingDraftCreate(
  status: number,
  run: () => Promise<void>,
): Promise<void> {
  await withFailingStub(
    async () =>
      await registerMapping({
        priority: 1,
        request: { method: "POST", urlPath: "/prior-authorities" },
        response: { status },
      }),
    run,
  );
}

export async function withFailingDraftSubmit(
  priorAuthorityId: string,
  status: number,
  run: () => Promise<void>,
): Promise<void> {
  await withFailingStub(
    async () =>
      await registerMapping({
        priority: 1,
        request: {
          method: "POST",
          urlPath: `/prior-authorities/${priorAuthorityId}/submit`,
        },
        response: { status },
      }),
    run,
  );
}
