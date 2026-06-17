import axios from "#node_modules/axios/index.js";

export const fetchExpertTypes = async (): Promise<string[]> => {
  try {
    const { data }: { data: string[] } = await axios.get(
      `${process.env.BACKEND_URL}/expertTypes`,
    );

    return data;
  } catch (error) {
    throw new Error("Error: Fetching Expert Types", { cause: error });
  }
};
