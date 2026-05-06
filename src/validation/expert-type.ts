import { z } from "zod";

export const expertTypeString = z.string().trim().min(1, {
  error: "Search for and select an expert type or enter your own",
});
