import { z } from "zod";

export const uploadedDocuments = z.object({
  PriorAuthorityDocuments: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === "") return [];
      if (typeof val === "string") return [val];
      return val;
    },
    z
      .array(z.string().min(1))
      .min(1, { message: "Please upload at least one document" }),
  ),
});
