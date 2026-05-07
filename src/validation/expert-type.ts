import { z } from "zod";

export const expertTypeSchema = z.object({
  "expert-list": z.string().trim().min(1, {
    message: "Search for and select an expert type or enter your own", //TODO: Update this message if the hint text is changed
  }),
});
