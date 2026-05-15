import { z, type ZodType } from "zod";

export const priorAuthorityEnum = z.enum(["Expert", "Expense", "Counsel"], {
  error: "Select the type of prior authority",
});

export const typeOfPriorAuthority = z.object({
  PriorAuthorityType: priorAuthorityEnum,
});

export const guidelineRatesExceededEnum = z.enum(["Yes", "No"], {
  error:
    "Select yes if the expert is charging more than the guideline rate or number of hours",
});

export const guidelineRatesExceeded: ZodType = z.object({
  GuidelineRatesExceeded: guidelineRatesExceededEnum,
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
