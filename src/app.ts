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
} from "#src/controllers/error.controller.js";
import { setupCsrf } from "#src/middleware/setupCsrf.js";

initializeI18nextSync();
const app = express();
const sessionManager = new SessionManager();
const sessionConfig = await sessionManager.getSessionConfig(config.session);

// csrf-sync isn't on the codeql whitelist here (https://github.com/github/codeql/blob/4c1461ad5bf31207de3b947a0864284e71c25e0c/javascript/ql/src/Security/CWE-352/MissingCsrfMiddleware.ql#L58).
// It is, however, used in hmpps-template-typescript so we have confidence in this approach.
// codeql[js/missing-token-validation]
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

setupCsrf(app);

app.set("trust proxy", 1);
app.use(getSessionUrl);
app.use(indexRouter);

app.all("{*splat}", routeNotFound);
app.use(serverErrors);

export default app;
