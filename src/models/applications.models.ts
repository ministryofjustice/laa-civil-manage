import axios from "#node_modules/axios/index.js";
import type { Application } from "#src/types/db-types/application.js";

export const fetchApplications = async (): Promise<Application[]> => {
  try {
    const { data }: { data: Application[] } = await axios.get(
      `${process.env.BACKEND_URL}/applications`,
    );

    return data;
  } catch (error) {
    throw new Error("Error: Fetching Applications", { cause: error });
  }
};

export const fetchApplicationById = async (
  id: string,
): Promise<Application[]> => {
  const { data }: { data: Application[] } = await axios.get(
    `${process.env.BACKEND_URL}/applications/${id}`,
  );

  return data;
};
