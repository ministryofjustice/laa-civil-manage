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
      error: "Full Name cannot be empty",
    })
    .trim()
    .min(1, { error: "Full Name cannot be empty" })
    .refine((val) => val.split(/\s+/v).length >= 2, {
      message: "Please enter a full name (at least two words).",
    }),
});
