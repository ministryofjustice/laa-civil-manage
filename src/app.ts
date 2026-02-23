import express from "express";
import morgan from "morgan";
import {
  setupMiddlewares,
  setupConfig,
} from "#middleware/index.js";
import session from "express-session";
import {
  nunjucksSetup,
  rateLimitSetUp,
  displayAsciiBanner,
} from "#utils/index.js";
import { initializeI18nextSync } from "#src/scripts/helpers/index.js";
import { config } from "#config.js";
import indexRouter from "#routes/index.js";
import livereload from "connect-livereload";
import SessionManager from "./middleware/session/session-manager.js";
import { getSessionUrl } from "./middleware/session/session-handler.js";

const TRUST_FIRST_PROXY = 1;

initializeI18nextSync();

const app = express();

const sessionManager = new SessionManager();
const sessionConfig = await sessionManager.getSessionConfig(config.session);

app.use(session(sessionConfig));

setupMiddlewares(app);

app.set("trust proxy", TRUST_FIRST_PROXY);

nunjucksSetup(app);

rateLimitSetUp(app, config);

setupConfig(app);

if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

app.use(getSessionUrl);

app.use("/", indexRouter);

if (process.env.NODE_ENV === "development") {
  app.use(livereload());
}

displayAsciiBanner(config);

export default app;
