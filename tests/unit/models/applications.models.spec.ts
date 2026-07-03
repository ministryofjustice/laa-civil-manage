import { describe, it, expect, spyOn, mock, afterEach } from "bun:test";
import { api } from "#src/middleware/auth/api-client.js";
import { getApplications } from "#src/models/applications.models.js";

describe("getApplications", () => {
  afterEach(() => {
    mock.restore();
  });

  it("returns the data from the backend /applications endpoint", async () => {
    const applications = [{ id: "app-1" }];
    const getSpy = spyOn(api, "get").mockResolvedValue({
      data: applications,
    });

    const result = await getApplications();

    expect(getSpy).toHaveBeenCalledWith("/applications");
    expect(result).toEqual(applications);
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
