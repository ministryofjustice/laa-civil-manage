import { api } from "#src/middleware/auth/api-client.js";

export const getApplications = async (): Promise<unknown> => {
  try {
    const { data } = await api.get<unknown>("/applications");
    return data;
  } catch (error) {
    throw new Error(
      `Failed to get applications: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
};
