import { z, type ZodType } from "zod";

const JUSTIFICATION_REQUIRED_MESSAGE =
  "Enter the reason this disbursement is necessary.";
const JUSTIFICATION_MAX_WORDS = 500;
const JUSTIFICATION_WORD_LIMIT_MESSAGE = `Justification must be ${JUSTIFICATION_MAX_WORDS} words or less`;

const countWords = (value: string): number => {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return 0;
  }
  return trimmedValue.split(/\s+/v).length;
};

export const disbursementJustificationSchema = z.object({
  justification: z
    .string({ error: JUSTIFICATION_REQUIRED_MESSAGE })
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

const DESCRIPTION_REQUIRED_MESSAGE = "Enter a description of the expense.";
const DESCRIPTION_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH_MESSAGE = `Expense description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`;
const AMOUNT_REQUIRED_MESSAGE = "Enter the amount of the expense.";
const AMOUNT_INVALID_MESSAGE = "Enter a valid expense amount.";
const AMOUNT_NEGATIVE_MESSAGE = "Expense amount cannot be negative.";
const AMOUNT_ZERO_MESSAGE = "Expense amount must be greater than £0.";

const isValidAmountFormat = (val: string): boolean =>
  /^\d+(?<temp1>\.\d{1,2})?$/v.test(val);

const validateDisbursementAmount = (
  amount: string | undefined,
  ctx: z.RefinementCtx,
): void => {
  const trimmed = amount?.trim() ?? "";

  if (!trimmed) {
    ctx.addIssue({
      code: "custom",
      message: AMOUNT_REQUIRED_MESSAGE,
      path: ["PriorAuthorityDisbursementAmount"],
    });
    return;
  }

  if (trimmed.startsWith("-")) {
    ctx.addIssue({
      code: "custom",
      message: AMOUNT_NEGATIVE_MESSAGE,
      path: ["PriorAuthorityDisbursementAmount"],
    });
    return;
  }

  if (!isValidAmountFormat(trimmed)) {
    ctx.addIssue({
      code: "custom",
      message: AMOUNT_INVALID_MESSAGE,
      path: ["PriorAuthorityDisbursementAmount"],
    });
    return;
  }

  if (parseFloat(trimmed) === 0) {
    ctx.addIssue({
      code: "custom",
      message: AMOUNT_ZERO_MESSAGE,
      path: ["PriorAuthorityDisbursementAmount"],
    });
  }
};

export const disbursementDetailsSchema: ZodType = z
  .object({
    PriorAuthorityDisbursementPurpose: z.string().optional(),
    PriorAuthorityDisbursementAmount: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const description = data.PriorAuthorityDisbursementPurpose?.trim() ?? "";
    if (!description) {
      ctx.addIssue({
        code: "custom",
        message: DESCRIPTION_REQUIRED_MESSAGE,
        path: ["PriorAuthorityDisbursementPurpose"],
      });
    } else if (description.length > DESCRIPTION_MAX_LENGTH) {
      ctx.addIssue({
        code: "custom",
        message: DESCRIPTION_MAX_LENGTH_MESSAGE,
        path: ["PriorAuthorityDisbursementPurpose"],
      });
    }

    validateDisbursementAmount(data.PriorAuthorityDisbursementAmount, ctx);
  });
