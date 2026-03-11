import { logger } from "#src/utils/logger.js";
import axios from "#node_modules/axios/index.js";
import type { Application } from "#types/application.js";

export const fetchApplications = async (): Promise<Application[]> => {
  const { data }: { data: Application[] } = await axios.get(
    `${process.env.BACKEND_URL}/applications`,
  );
  logger.logInfo("Application Log", `${process.env.BACKEND_URL}/applications`);
  return data;
};

export const fetchApplicationById = async (
  id: string,
): Promise<Application[]> => {
  const { data }: { data: Application[] } = await axios.get(
    `${process.env.BACKEND_URL}/applications/${id}`,
  );
  logger.logInfo(
    "Application Id Log",
    `${process.env.BACKEND_URL}/applications/${id}`,
  );

  return data;
};
