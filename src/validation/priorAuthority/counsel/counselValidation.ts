import { z } from "zod";

export const counselTypeSchema = z.enum(
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