import axios from "#node_modules/axios/index.js";
import type { Application } from "#types/application.js";

export const fetchApplications = async (): Promise<Application[]> => {
  const { data }: { data: Application[] } = await axios.get(
    `${process.env.BACKEND_URL}/applications`,
  );

  return data;
};
