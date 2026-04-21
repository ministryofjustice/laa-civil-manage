// import app from "#src/app.js";
import { z } from "zod";
// import type { Request, Response } from "express";
import { defineConfig } from "#node_modules/@playwright/test/index.js";
export default defineConfig({
  rules: {
    "@typescript-eslint/no-unsafe-assignment": "error",
  },
});

// interface FormData {
//   first_name: string;
//   last_name: string;
//   "date-of-birth-day": string;
//   "date-of-birth-month": string;
//   "date-of-birth-year": string;
//   email: string;
// }

// Schema Definition
export const userSchema = z.object({
  "person[0][first_name]": z.string().min(2, "First name is required"),
  "person[0][last_name]": z.string().min(2, "Last name is required"),
  "person[0][dob][day]": z.string().min(1, "Day is required"),
  "person[0][dob][month]": z.string().min(1, "Month is required"),
  "person[0][dob][year]": z.string().min(4, "Year is required"),
  "person[0][email]": z.email("Invalid email address"),
});

// Parse data
// app.get("/pa-form/prototype", (req, res) => {
//   res.render("prototype.njk", { errors: {}, values: {} });
// });
// data to validate
// app.get(
//   "/submit",
//   (
//     req: Request<Record<string, never>, Record<string, never>, FormData>,
//     res: Response,
//   ) => {
// req.body is the object Nunjucks sent over

// console.log("DEBUG: Form Body:", req.body); // eslint-disable-line no-console -- Debugging incoming form data

// const result = userSchema.safeParse(req.body);
// if (!result.success) {
//   const errors = z.treeifyError(result.error);

//   res.render("prototype.njk", {
//     errors,
//     values: req.body,
//   });
//   // return;
// }

// res.send("Form submitted successfully!");
//   },
// );
