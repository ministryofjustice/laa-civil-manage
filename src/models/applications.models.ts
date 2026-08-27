import { api } from "#src/middleware/auth/apiClient.js";
import type {
  ApplicationsResponse,
  ApplicationSummary,
} from "#src/types/applications.js";

export const getApplications = async (
  page = 1,
): Promise<ApplicationsResponse> => {
  try {
    const { data } = await api.get<ApplicationsResponse>("/applications", {
      params: { page, pageSize: 10 },
    });
    return data;
  } catch (error) {
    throw new Error(
      `Failed to get applications: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
};

export const getApplicationById = async (
  applicationId: string,
): Promise<ApplicationSummary> => {
  try {
    const { data } = await api.get<ApplicationSummary>(
      `/applications/${applicationId}`,
    );
    return data;
  } catch (error) {
    throw new Error(
      `Failed to get application by ID: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
};
