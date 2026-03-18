import express from "express";
import morgan from "morgan";
import session from "express-session";
import { config } from "#src/config.js";
import indexRouter from "#src/routes/index.router.js";
import livereload from "connect-livereload";
import SessionManager from "#/src/middleware/session/session-manager.js";
import { getSessionUrl } from "#/src/middleware/session/session-handler.js";
import { setupMiddlewares } from "#src/middleware/commonMiddleware.js";
import authRouter from "#/src/routes/auth.router.js";
import { checkAuthToken } from "#/src/middleware/auth/auth-handlers.js";
import { initializeI18nextSync } from "#src/scripts/i18nLoader.js";
import applicationsRouter from "#src/routes/applications.router.js";
import { nunjucksSetup } from "#src/utils/nunjucksSetup.js";
import { rateLimitSetUp } from "#src/utils/rateLimitSetUp.js";

initializeI18nextSync();
const app = express();
const sessionManager = new SessionManager();
const sessionConfig = await sessionManager.getSessionConfig(config.session);

app.use(session(sessionConfig));

setupMiddlewares(app);

app.set("trust proxy", 1);

nunjucksSetup(app);

rateLimitSetUp(app, config);

if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

app.use(getSessionUrl);

app.use("/auth", authRouter);

app.use("/", indexRouter);
if (process.env.NODE_ENV !== "development") {
  app.use(checkAuthToken);
}
app.use("/", applicationsRouter);

if (process.env.NODE_ENV === "development") {
  app.use(livereload());
}

export default app;
