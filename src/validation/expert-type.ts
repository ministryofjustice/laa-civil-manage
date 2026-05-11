import { z } from "zod";

export const typeOfExpert = z.object({
  PriorAuthorityExpertType: z
    .string({
      error: "Search for and select an expert type",
    })
    .trim()
    .min(1, {
      message: "Search for and select an expert type",
    }),
});
