import { z, type ZodType } from "zod";

export const priorAuthorityEnum = z.enum(["Expert", "Expense", "Counsel"], {
  error: "Select the type of prior authority",
});

export const typeOfPriorAuthority = z.object({
  PriorAuthorityType: priorAuthorityEnum,
});

export const priorAuthorityBillingTypeEnum = z.enum(["Hourly", "Flat rate"], {
  error: "Select the billing type",
});

export const billingTypeOfPriorAuthority = z.object({
  PriorAuthorityBillingType: priorAuthorityBillingTypeEnum,
});

export const uploadedDocuments = z.object({
  PriorAuthorityDocuments: z
    .array(
      z.object({
        fileName: z.string(),
        originalFileName: z.string(),
      }),
    )
    .min(1, { error: "Please upload at least one document" }),
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

const isPositiveDecimal = (val: string): boolean =>
  /^\d+(\.\d{1,2})?$/.test(val) && parseFloat(val) > 0;

export const expertCosts = z
  .object({
    PriorAuthorityExpertFullName: z
      .string({ error: "Enter the expert's full name" })
      .trim()
      .min(1, { error: "Enter the expert's full name" }),
    PriorAuthorityBillingType: priorAuthorityBillingTypeEnum,
    PriorAuthorityHourlyRate: z.string().optional(),
    PriorAuthorityEstimatedHours: z.string().optional(),
    PriorAuthorityEstimatedMinutes: z.string().optional(),
    PriorAuthorityTotalAmount: z.string().optional(),
    PriorAuthorityFlatRateTotalAmount: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.PriorAuthorityBillingType === "Hourly") {
      const hourlyRate = data.PriorAuthorityHourlyRate?.trim() ?? "";
      if (!hourlyRate) {
        ctx.addIssue({
          code: "custom",
          message: "Enter the hourly rate",
          path: ["PriorAuthorityHourlyRate"],
        });
      } else if (!isPositiveDecimal(hourlyRate)) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid hourly rate, like 50 or 99.99",
          path: ["PriorAuthorityHourlyRate"],
        });
      }

      const hasHours = !!data.PriorAuthorityEstimatedHours?.trim();
      const hasMinutes = !!data.PriorAuthorityEstimatedMinutes?.trim();
      if (!hasHours && !hasMinutes) {
        ctx.addIssue({
          code: "custom",
          message: "Enter the time requested in hours and/or minutes",
          path: ["PriorAuthorityEstimatedHours"],
        });
      }

      const totalAmount = data.PriorAuthorityTotalAmount?.trim() ?? "";
      if (!totalAmount) {
        ctx.addIssue({
          code: "custom",
          message: "Enter the total amount",
          path: ["PriorAuthorityTotalAmount"],
        });
      } else if (!isPositiveDecimal(totalAmount)) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid total amount, like 100 or 249.99",
          path: ["PriorAuthorityTotalAmount"],
        });
      }
    } else if (data.PriorAuthorityBillingType === "Flat rate") {
      const flatRateTotal =
        data.PriorAuthorityFlatRateTotalAmount?.trim() ?? "";
      if (!flatRateTotal) {
        ctx.addIssue({
          code: "custom",
          message: "Enter the total amount",
          path: ["PriorAuthorityFlatRateTotalAmount"],
        });
      } else if (!isPositiveDecimal(flatRateTotal)) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid total amount, like 100 or 249.99",
          path: ["PriorAuthorityFlatRateTotalAmount"],
        });
      }
    }
  });

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
