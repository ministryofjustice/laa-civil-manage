import { api } from "#src/middleware/auth/api-client.js";

export const fetchExpertTypes = async (): Promise<string[]> => {
  try {
    const { data }: { data: string[] } = await api.get(
      `${process.env.BACKEND_URL}/expertTypes`,
    );

    return data;
  } catch (error) {
    throw new Error("Error: Fetching Expert Types", { cause: error });
  }
};
