import express from "express";
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
import postSubmit from "#src/controllers/prototype.controllers.js";

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

// app.get("/pa-form/prototype", (req, res) => {
//   res.render("pa-form/prototype", { errors: {}, values: {} });
// });

app.post("/submit", postSubmit);

app.all("{*splat}", routeNotFound);

app.use(serverErrors);

export default app;
