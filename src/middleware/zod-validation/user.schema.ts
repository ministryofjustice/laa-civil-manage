// import app from "#src/app.js";
import { z } from "zod";

export const userSchema = z
  .object({
    "person[0][first_name]": z.string().min(1, "Enter a first name"),
    "person[0][last_name]": z.string().min(1, "Enter a last name"),

    "person[0][dob][day]": z.string(),
    "person[0][dob][month]": z.string(),
    "person[0][dob][year]": z.string(),

    "person[0][email]": z.email(
      "Enter an email address in the correct format, like name@example.com",
    ),
  })
  // eslint-disable-next-line complexity -- all these things need validation, so will need to be complex.
  .superRefine((data, ctx) => {
    const dayStr = data["person[0][dob][day]"];
    const monthStr = data["person[0][dob][month]"];
    const yearStr = data["person[0][dob][year]"];

    const hasDay = dayStr.trim() !== "";
    const hasMonth = monthStr.trim() !== "";
    const hasYear = yearStr.trim() !== "";

    // 1. Scenario: Completely empty
    if (!hasDay && !hasMonth && !hasYear) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a date of birth",
        path: ["person[0][dob][day]"], // Attaches error to the 'day' input so the anchor link works
      });
      return;
    }

    // 2. Scenario: Missing one or two fields
    const missing = [];
    if (!hasDay) missing.push("day");
    if (!hasMonth) missing.push("month");
    if (!hasYear) missing.push("year");

    if (missing.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: `Date of birth must include a ${missing.join(" and ")}`,
        path: ["person[0][dob][day]"],
      });
      return;
    }

    // 3. Scenario: Not a real date (e.g., letters, or 31st Feb)
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    const date = new Date(year, month - 1, day);

    if (
      isNaN(date.getTime()) ||
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Date of birth must be a real date",
        path: ["person[0][dob][day]"],
      });
      return;
    }

    // 4. Scenario: Date is in the future
    if (date >= new Date()) {
      ctx.addIssue({
        code: "custom",
        message: "Date of birth must be in the past",
        path: ["person[0][dob][day]"],
      });
    }
  });
