import { z } from "zod";

const counselTypeEnumSchema = z.enum(
  [
    "King's Counsel alone",
    "Two Junior Counsel",
    "King's Counsel and Junior Counsel",
    "King's Counsel and Two Junior Counsel",
  ],
  {
    error: "Select the counsel type",
  },
);

export const counselTypeSchema = z.object({
  CounselType: counselTypeEnumSchema,
});
