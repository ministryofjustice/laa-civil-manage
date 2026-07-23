import { api } from "#src/middleware/auth/api-client.js";
import type { ApplicationsResponse } from "#src/types/applications.js";

export const getApplications = async (
  page = 1,
): Promise<ApplicationsResponse> => {
  try {
    const { data } = await api.get<ApplicationsResponse>("/applications", {
      params: { page },
    });
    return data;
  } catch (error) {
    throw new Error(
      `Failed to get applications: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
};
