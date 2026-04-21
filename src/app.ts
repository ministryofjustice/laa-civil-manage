import express, { type Request, type Response } from "express";
import session from "express-session";
import { config } from "#src/config.js";
import indexRouter from "#src/routes/index.router.js";
import SessionManager from "#/src/middleware/session/session-manager.js";
import { getSessionUrl } from "#/src/middleware/session/session-handler.js";
import { setupMiddlewares } from "#src/middleware/commonMiddleware.js";
import { initializeI18nextSync } from "#src/scripts/i18nLoader.js";
import { nunjucksSetup } from "#src/utils/nunjucksSetup.js";
import rateLimit from "#node_modules/express-rate-limit/dist/index.mjs";
import {
  routeNotFound,
  serverErrors,
} from "#src/controllers/errors.controllers.js";
import { userSchema } from "#src/middleware/zod-validation/user.schema.js";
import z from "#node_modules/zod/index.cjs";

interface FormData {
  first_name: string;
  last_name: string;
  "date-of-birth-day": string;
  "date-of-birth-month": string;
  "date-of-birth-year": string;
  email: string;
}

initializeI18nextSync();
const app = express();
const sessionManager = new SessionManager();
const sessionConfig = await sessionManager.getSessionConfig(config.session);

app.use(session(sessionConfig));
app.use(
  rateLimit({
    windowMs: config.RATE_WINDOW_MS,
    max: config.RATE_LIMIT_MAX,
    message: `Too many requests, please try again later.`,
  }),
);

nunjucksSetup(app);
setupMiddlewares(app);

app.set("trust proxy", 1);
app.use(getSessionUrl);
app.use(indexRouter);

app.get("/pa-form/prototype", (req, res) => {
  res.render("pa-form/prototype", { errors: {}, values: {} });
});

app.post(
  "/submit",
  (
    req: Request<Record<string, never>, Record<string, never>, FormData>,
    res: Response,
  ) => {
 

    console.log("DEBUG: Form Body:", req.body); // eslint-disable-line no-console -- Debugging incoming form data

    const result = userSchema.safeParse(req.body);
    if (!result.success) {
      const errors = z.treeifyError(result.error);

      res.render("pa-form/prototype", {
        errors,
        values: req.body,
      }); 
      // return;
    }

    return res.send("Form submitted successfully!");
  },
);

app.all("{*splat}", routeNotFound);
app.use(serverErrors);

export default app;
