import { describe, it, expect, mock, beforeEach, afterAll } from "bun:test";
import type { NextFunction, Request, Response } from "express";
import {
  getAllApplicationsPage,
  getApplicationsList,
} from "#src/controllers/applications.controller.js";
import { getApplications } from "#src/models/applications.models.js";
import type {
  ApplicationsResponse,
  ApplicationSummary,
} from "#src/types/applications.js";

void mock.module("#src/models/applications.models.js", () => ({
  getApplications: mock(
    async () =>
      await Promise.resolve({
        paging: { page: 0, pageSize: 10, itemsReturned: 1, totalRecords: 1 },
        applications: [{ applicationId: "app-1" }],
      }),
  ),
}));

const buildApp = (overrides?: Record<string, unknown>): ApplicationSummary => ({
  applicationId: "APP-1001",
  clientFirstName: "Jane",
  clientLastName: "Doe",
  submittedAt: "2024-03-20T10:30:00Z",
  laaReference: "LAA-778899",
  status: "APPLICATION_IN_PROGRESS",
  ...overrides,
});

const buildResponse = (
  apps: ApplicationSummary[],
  pagingOverrides?: Record<string, unknown>,
): ApplicationsResponse => ({
  paging: {
    page: 1,
    pageSize: 10,
    itemsReturned: apps.length,
    totalRecords: apps.length,
    ...pagingOverrides,
  },
  applications: apps,
});

describe("getAllApplicationsPage controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let render: ReturnType<typeof mock>;

  let redirect: ReturnType<typeof mock>;

  beforeEach(() => {
    render = mock();
    redirect = mock();
    req = { session: {} as Request["session"], query: {} };
    res = { render, redirect };
    next = mock();
    (getApplications as ReturnType<typeof mock>).mockClear();
  });

  it("renders the applications table rows from an array response", async () => {
    (getApplications as ReturnType<typeof mock>).mockImplementation(
      async () => await Promise.resolve(buildResponse([buildApp()])),
    );

    req = { session: {} as Request["session"], query: {} };

    await getAllApplicationsPage(req as Request, res as Response, next);

    expect(render).toHaveBeenCalledWith("applications/allApplications", {
      applicationRows: [
        [
          { text: "Jane Doe" },
          {
            text: "20 March 2024",
            attributes: { "data-sort-value": "1710930600000" },
          },
          { text: "LAA-778899" },
          {
            html: '<strong class="govuk-tag govuk-tag--red">In progress</strong>',
            attributes: { "data-sort-value": "In progress" },
          },
          {
            html: '<a class="govuk-link" href="/applications/APP-1001">View</a>',
          },
        ],
      ],
      pagination: {
        items: [{ number: 1, href: "/applications?page=1", current: true }],
        results: { from: 1, to: 1, count: 1, text: "results" },
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("renders multiple applications table rows", async () => {
    const apps = [
      buildApp(),
      buildApp({
        applicationId: "APP-1002",
        clientFirstName: "John",
        clientLastName: "Smith",
        submittedAt: "2024-03-22T09:00:00Z",
        laaReference: "LAA-112233",
        status: "APPLICATION_SUBMITTED",
      }),
    ];
    (getApplications as ReturnType<typeof mock>).mockImplementation(
      async () => await Promise.resolve(buildResponse(apps)),
    );

    req = { session: {} as Request["session"], query: {} };

    await getAllApplicationsPage(req as Request, res as Response, next);

    expect(render).toHaveBeenCalledWith("applications/allApplications", {
      applicationRows: [
        [
          { text: "Jane Doe" },
          {
            text: "20 March 2024",
            attributes: { "data-sort-value": "1710930600000" },
          },
          { text: "LAA-778899" },
          {
            html: '<strong class="govuk-tag govuk-tag--red">In progress</strong>',
            attributes: { "data-sort-value": "In progress" },
          },
          {
            html: '<a class="govuk-link" href="/applications/APP-1001">View</a>',
          },
        ],
        [
          { text: "John Smith" },
          {
            text: "22 March 2024",
            attributes: { "data-sort-value": "1711098000000" },
          },
          { text: "LAA-112233" },
          {
            html: '<strong class="govuk-tag govuk-tag--green">Submitted</strong>',
            attributes: { "data-sort-value": "Submitted" },
          },
          {
            html: '<a class="govuk-link" href="/applications/APP-1002">View</a>',
          },
        ],
      ],
      pagination: {
        items: [{ number: 1, href: "/applications?page=1", current: true }],
        results: { from: 1, to: 2, count: 2, text: "results" },
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("stores page in session and redirects when page query param is present", async () => {
    req = { session: {} as Request["session"], query: { page: "2" } };

    await getAllApplicationsPage(req as Request, res as Response, next);

    expect(redirect).toHaveBeenCalledWith("/applications");
    expect((req as Request).session.applicationsPage).toBe(2);
    expect(render).not.toHaveBeenCalled();
  });

  it("builds correct pagination for page 2 of 3", async () => {
    (getApplications as ReturnType<typeof mock>).mockImplementation(
      async () =>
        await Promise.resolve(
          buildResponse([buildApp()], {
            page: 2,
            pageSize: 10,
            itemsReturned: 10,
            totalRecords: 25,
          }),
        ),
    );

    req = {
      session: { applicationsPage: 2 } as Request["session"],
      query: {},
    };

    await getAllApplicationsPage(req as Request, res as Response, next);

    const [, renderArgs] = render.mock.calls[0] as [
      string,
      { pagination: { previous?: object; next?: object; items: unknown[] } },
    ];

    expect(renderArgs.pagination.previous).toEqual({
      href: "/applications?page=1",
    });
    expect(renderArgs.pagination.next).toEqual({
      href: "/applications?page=3",
    });
    expect(renderArgs.pagination.items).toHaveLength(3);
  });

  it("forwards errors to next when the model throws", async () => {
    const error = new Error("backend down");
    (getApplications as ReturnType<typeof mock>).mockImplementation(
      async () => await Promise.reject(error),
    );

    await getAllApplicationsPage(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(render).not.toHaveBeenCalled();
  });
});

describe("getApplicationsList controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let json: ReturnType<typeof mock>;

  beforeEach(() => {
    json = mock();
    req = { session: {} as Request["session"] };
    res = { json };
    next = mock();
    (getApplications as ReturnType<typeof mock>).mockClear();
  });

  it("responds with the applications from the model as JSON", async () => {
    const response = {
      paging: { page: 0, pageSize: 10, itemsReturned: 1, totalRecords: 1 },
      applications: [{ id: "app-1" }],
    };
    (getApplications as ReturnType<typeof mock>).mockImplementation(
      async () => await Promise.resolve(response),
    );

    await getApplicationsList(req as Request, res as Response, next);

    expect(getApplications).toHaveBeenCalledTimes(1);
    expect(json).toHaveBeenCalledWith(response);
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards errors to next when the model throws", async () => {
    const error = new Error("backend down");
    (getApplications as ReturnType<typeof mock>).mockImplementation(
      async () => await Promise.reject(error),
    );

    await getApplicationsList(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(json).not.toHaveBeenCalled();
  });
});

afterAll(() => {
  mock.restore();
});
