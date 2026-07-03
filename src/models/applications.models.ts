import type { AxiosInstance } from "#node_modules/axios/index.js";

export const getApplications = async (
  backend: AxiosInstance,
): Promise<unknown> => {
  try {
    const { data } = await backend.get<unknown>("/applications");
    return data;
  } catch (error) {
    throw new Error(
      `Failed to get applications: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
};
