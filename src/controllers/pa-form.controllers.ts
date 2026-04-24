import type { Request, Response } from "#node_modules/@types/express/index.js";
import { userSchema } from "#src/middleware/zod-validation/user.schema.js";
import { z } from "zod";

export const getStartPage = (req: Request, res: Response): void => {
  res.render("pa-form/start-page.njk");
};
export const getPaTypePage = (req: Request, res: Response): void => {
  res.render("pa-form/type-pa.njk");
};

export const getConfirmationPage = (req: Request, res: Response): void => {
  res.render("pa-form/confirmation-page.njk");
};

export const getPrototype = (req: Request, res: Response): void => {
  res.render("pa-form/prototype.njk");
};

// export default function postSubmit(
//   req: Request<Record<string, never>, Record<string, never>, FormData>,
//   res: Response,
// ): void {
//   const result = userSchema.safeParse(req.body);

//   if (!result.success) {
//     const errors = z.treeifyError(result.error);

//     res.render("pa-form/prototype", {
//       errors,
//       values: req.body,
//     });
//     return;
//   }

//   res.send(`
//     <div style="font-family: sans-serif; max-width: 600px; margin: 40px auto; text-align: center;">
//       <h1 style="color: #00703c;">Success!</h1>
//       <p>The form passed validation.</p>
//       <a href="/" style="color: #1d70b8;">Go back</a>
//     </div>
//   `);
// }
