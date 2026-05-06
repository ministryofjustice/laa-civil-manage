import { z } from "zod";

export const priorAuthorityEnum = z.enum(["Expert", "Expense", "Counsel"], {
  error: "Select the type of prior authority",
});

export const typeOfPriorAuthority = z.object({
  PriorAuthorityType: priorAuthorityEnum,
});

export const fullNameOfExpert = z.object({
  PriorAuthorityExpertFullName: z
    .string({
      error: "Enter the expert's full name",
    })
    .trim()
    .min(1, {
      error: "Enter the expert's full name",
    }),
});
