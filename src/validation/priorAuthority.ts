import { z, type ZodType } from "zod";

export const priorAuthorityTypeSchema = z.enum(
  ["Expert", "Disbursement", "Counsel"],
  {
    error: "Select the type of prior authority",
  },
);

export const typeOfPriorAuthoritySchema = z.object({
  PriorAuthorityType: priorAuthorityTypeSchema,
});

export const uploadedDocumentsSchema = z.object({
  PriorAuthorityDocuments: z
    .array(
      z.object({
        fileName: z.string(),
        originalFileName: z.string(),
      }),
    )
    .min(1, { error: "Please upload at least one document" }),
});
export const guidelineRatesExceededEnumSchema = z.enum(["Yes", "No"], {
  error:
    "Select yes if the expert is charging more than the guideline rate or number of hours",
});

export const guidelineRatesExceededSchema: ZodType = z.object({
  GuidelineRatesExceeded: guidelineRatesExceededEnumSchema,
});

export const expertBasedInLondonEnumSchema = z.enum(["Yes", "No"], {
  error: 'Select "Yes" if the expert is based in London',
});

export const expertBasedInLondonSchema: ZodType = z.object({
  expertBasedInLondon: expertBasedInLondonEnumSchema,
});

export const fullNameOfExpertSchema = z.object({
  PriorAuthorityExpertFullName: z
    .string({
      error: "Enter the expert's full name",
    })
    .trim()
    .min(1, {
      error: "Enter the expert's full name",
    }),
});

export const estimatedTimeSchema = z
  .object({
    PriorAuthorityEstimatedHours: z.string().optional(),
    PriorAuthorityEstimatedMinutes: z.string().optional(),
  })
  .optional();

const isPositiveDecimal = (val: string): boolean =>
  /^\d+(?<temp1>\.\d{1,2})?$/v.test(val) && parseFloat(val) > 0;

const isNonNegativeInteger = (val: string): boolean => /^\d+$/v.test(val);

const validateMonetaryAmount = (
  amount: string | undefined,
  emptyMessage: string,
  invalidMessage: string,
  path: string[],
  ctx: z.RefinementCtx,
): void => {
  const trimmed = amount?.trim() ?? "";
  if (!trimmed) {
    ctx.addIssue({ code: "custom", message: emptyMessage, path });
  } else if (!isPositiveDecimal(trimmed)) {
    ctx.addIssue({ code: "custom", message: invalidMessage, path });
  }
};

const validateHourlyCalculationFields = (
  data: {
    PriorAuthorityHourlyRate?: string;
    PriorAuthorityEstimatedTime?: {
      PriorAuthorityEstimatedHours?: string;
      PriorAuthorityEstimatedMinutes?: string;
    };
  },
  ctx: z.RefinementCtx,
): void => {
  validateMonetaryAmount(
    data.PriorAuthorityHourlyRate,
    "Enter the hourly rate",
    "Enter a valid hourly rate, like 50 or 99.99",
    ["PriorAuthorityHourlyRate"],
    ctx,
  );

  const hours =
    data.PriorAuthorityEstimatedTime?.PriorAuthorityEstimatedHours?.trim();
  if (!hours) {
    ctx.addIssue({
      code: "custom",
      message: "Enter the hours",
      path: ["PriorAuthorityEstimatedTime.PriorAuthorityEstimatedHours"],
    });
  } else if (!isNonNegativeInteger(hours)) {
    ctx.addIssue({
      code: "custom",
      message: "Enter hours as a whole number",
      path: ["PriorAuthorityEstimatedTime.PriorAuthorityEstimatedHours"],
    });
  }

  const minutes =
    data.PriorAuthorityEstimatedTime?.PriorAuthorityEstimatedMinutes?.trim();
  if (!minutes) {
    ctx.addIssue({
      code: "custom",
      message: "Enter the minutes",
      path: ["PriorAuthorityEstimatedTime.PriorAuthorityEstimatedMinutes"],
    });
  } else if (!isNonNegativeInteger(minutes)) {
    ctx.addIssue({
      code: "custom",
      message: "Enter minutes as a whole number",
      path: ["PriorAuthorityEstimatedTime.PriorAuthorityEstimatedMinutes"],
    });
  } else if (parseInt(minutes, 10) > 59) {
    ctx.addIssue({
      code: "custom",
      message: "Enter minutes between 0 and 59",
      path: ["PriorAuthorityEstimatedTime.PriorAuthorityEstimatedMinutes"],
    });
  }
};

const billingSchema = z.discriminatedUnion(
  "PriorAuthorityBillingType",
  [
    z
      .object({
        PriorAuthorityBillingType: z.literal("Hourly"),
        PriorAuthorityHourlyRate: z.string().optional(),
        PriorAuthorityEstimatedTime: estimatedTimeSchema,
      })
      .superRefine((data, ctx) => {
        validateHourlyCalculationFields(data, ctx);
      }),
    z
      .object({
        PriorAuthorityBillingType: z.literal("Fixed rate"),
        PriorAuthorityFixedRateTotalAmount: z.string().optional(),
      })
      .superRefine((data, ctx) => {
        validateMonetaryAmount(
          data.PriorAuthorityFixedRateTotalAmount,
          "Enter the total amount",
          "Enter a valid total amount, like 100 or 249.99",
          ["PriorAuthorityFixedRateTotalAmount"],
          ctx,
        );
      }),
  ],
  { error: () => "Select the billing type" },
);

export const expertCostsSchema = billingSchema;

export const expertCostsCalculationSchema = z.discriminatedUnion(
  "PriorAuthorityBillingType",
  [
    z
      .object({
        PriorAuthorityBillingType: z.literal("Hourly"),
        PriorAuthorityHourlyRate: z.string().optional(),
        PriorAuthorityEstimatedTime: estimatedTimeSchema,
      })
      .superRefine((data, ctx) => {
        validateHourlyCalculationFields(data, ctx);
      }),
    z
      .object({
        PriorAuthorityBillingType: z.literal("Fixed rate"),
        PriorAuthorityFixedRateTotalAmount: z.string().optional(),
      })
      .superRefine((data, ctx) => {
        validateMonetaryAmount(
          data.PriorAuthorityFixedRateTotalAmount,
          "Enter the total amount",
          "Enter a valid total amount, like 100 or 249.99",
          ["PriorAuthorityFixedRateTotalAmount"],
          ctx,
        );
      }),
  ],
  { error: () => "Select the billing type" },
);

export const typeOfExpertSchema = z
  .object({
    PriorAuthorityExpertType: z
      .string({
        error: "Search for and select an expert type",
      })
      .trim()
      .min(1, {
        message: "Search for and select an expert type",
      }),
    PriorAuthorityExpertTypeOther: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const otherExpertType = data.PriorAuthorityExpertTypeOther?.trim() ?? "";

    if (data.PriorAuthorityExpertType !== "Other") {
      if (otherExpertType) {
        ctx.addIssue({
          code: "custom",
          message: "Clear the expert type text unless you selected Other",
          path: ["PriorAuthorityExpertTypeOther"],
        });
      }

      return;
    }

    if (!otherExpertType) {
      ctx.addIssue({
        code: "custom",
        message: "Enter the expert type",
        path: ["PriorAuthorityExpertTypeOther"],
      });
    }
  });

export const expertDetailsSchema = typeOfExpertSchema.and(
  fullNameOfExpertSchema,
);
