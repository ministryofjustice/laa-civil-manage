import { describe, it, expect, spyOn, mock, afterEach } from "bun:test";
import { api } from "#src/middleware/auth/api-client.js";
import { getApplications } from "#src/models/applications.models.js";
import type { ApplicationsResponse } from "#src/types/applications.js";

describe("getApplications", () => {
  afterEach(() => {
    mock.restore();
  });

  it("returns the data from the backend /applications endpoint", async () => {
    const response: ApplicationsResponse = {
      paging: { page: 1, pageSize: 10, itemsReturned: 1, totalRecords: 1 },
      applications: [
        {
          applicationId: "app-1",
          status: "APPLICATION_IN_PROGRESS",
          submittedAt: "2024-03-20T10:30:00Z",
          clientFirstName: "Jane",
          clientLastName: "Doe",
          laaReference: "LAA-778899",
        },
      ],
    };
    const getSpy = spyOn(api, "get").mockResolvedValue({
      data: response,
    });

    const result = await getApplications();

    expect(getSpy).toHaveBeenCalledWith("/applications", {
      params: { page: 1, pageSize: 10, status: "APPLICATION_SUBMITTED" },
    });
    expect(result).toEqual(response);
  });

  it("passes the page param to the backend", async () => {
    const getSpy = spyOn(api, "get").mockResolvedValue({
      data: {
        paging: { page: 2, pageSize: 10, itemsReturned: 5, totalRecords: 25 },
        applications: [],
      },
    });

    await getApplications(2);

    expect(getSpy).toHaveBeenCalledWith("/applications", {
      params: { page: 2, pageSize: 10, status: "APPLICATION_SUBMITTED" },
    });
  });

  it("wraps backend errors with context and preserves the cause", async () => {
    const cause = new Error("boom");
    spyOn(api, "get").mockRejectedValue(cause);

    const error = await getApplications().catch((err: unknown) => err);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("Failed to get applications: boom");
    expect((error as Error).cause).toBe(cause);
  });
});
