import { z } from "zod";

const counselTypeEnumSchema = z.enum(
  [
    "KINGS_COUNSEL_ALONE",
    "TWO_JUNIOR_COUNSEL",
    "KINGS_COUNSEL_AND_JUNIOR_COUNSEL",
    "KINGS_COUNSEL_AND_TWO_JUNIOR_COUNSEL",
  ],
  {
    error: "Select the counsel type",
  },
);

export const counselTypeSchema = z.object({
  CounselType: counselTypeEnumSchema,
});

const JUSTIFICATION_REQUIRED_MESSAGE =
  "Enter the reason for requesting specialised Counsel.";
const JUSTIFICATION_MAX_WORDS = 500;
const JUSTIFICATION_WORD_LIMIT_MESSAGE = `Justification must be ${JUSTIFICATION_MAX_WORDS} words or less`;

const countWords = (value: string): number => {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return 0;
  }

  return trimmedValue.split(/\s+/v).length;
};

export const counselJustificationSchema = z.object({
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
