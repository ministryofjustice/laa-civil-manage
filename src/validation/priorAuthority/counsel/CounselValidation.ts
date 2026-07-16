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
