import { z, type ZodType } from "zod";

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

const parseMonetaryAmount = (val: string | undefined): number | undefined => {
  const trimmed = val?.trim() ?? "";
  return isPositiveDecimal(trimmed) ? parseFloat(trimmed) : undefined;
};

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

export const apportionedDetailsSchema: ZodType = z
  .object({
    PriorAuthorityNumberOfParties: z.string().optional(),
    PriorAuthorityApportionedAmount: z.string().optional(),
    expertCost: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const parties = data.PriorAuthorityNumberOfParties?.trim() ?? "";
    if (!parties) {
      ctx.addIssue({
        code: "custom",
        message: "Enter the number of parties sharing the costs",
        path: ["PriorAuthorityNumberOfParties"],
      });
    } else if (!isNonNegativeInteger(parties)) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a whole number greater than 1",
        path: ["PriorAuthorityNumberOfParties"],
      });
    } else if (parseInt(parties, 10) < 2) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a whole number greater than 1",
        path: ["PriorAuthorityNumberOfParties"],
      });
    }

    validateMonetaryAmount(
      data.PriorAuthorityApportionedAmount,
      "Enter the client's apportioned share of the expert cost",
      "Enter a valid amount for the client's apportioned share",
      ["PriorAuthorityApportionedAmount"],
      ctx,
    );

    const share = parseMonetaryAmount(data.PriorAuthorityApportionedAmount);
    const total = parseMonetaryAmount(data.expertCost);
    if (share !== undefined && total !== undefined && share >= total) {
      ctx.addIssue({
        code: "custom",
        message: `The client's share must be less than the total expert cost of £${total.toFixed(
          2,
        )}`,
        path: ["PriorAuthorityApportionedAmount"],
      });
    }
  });

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

const JUSTIFICATION_REQUIRED_MESSAGE =
  "Enter why this application is necessary";
const JUSTIFICATION_MAX_WORDS = 500;
const JUSTIFICATION_WORD_LIMIT_MESSAGE = `Justification must be ${JUSTIFICATION_MAX_WORDS} words or less`;

const countWords = (value: string): number => {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return 0;
  }

  return trimmedValue.split(/\s+/v).length;
};

export const justificationSchema: ZodType = z.object({
  justification: z
    .string({
      error: JUSTIFICATION_REQUIRED_MESSAGE,
    })
    .trim()
    .superRefine((value, ctx) => {
      if (value.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: JUSTIFICATION_REQUIRED_MESSAGE,
        });
        return;
      }

      if (countWords(value) > JUSTIFICATION_MAX_WORDS) {
        ctx.addIssue({
          code: "custom",
          message: JUSTIFICATION_WORD_LIMIT_MESSAGE,
        });
      }
    }),
});
