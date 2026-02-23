import express from "express";
import morgan from "morgan";
import session from "express-session";
import { nunjucksSetup, rateLimitSetUp } from "#utils/index.js";
import { config } from "#config.js";
import indexRouter from "#routes/index.js";
import livereload from "connect-livereload";
import SessionManager from "./middleware/session/session-manager.js";
import { getSessionUrl } from "./middleware/session/session-handler.js";
import { setupMiddlewares } from "#middleware/commonMiddleware.js";

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

app.use("/", indexRouter);

if (process.env.NODE_ENV === "development") {
  app.use(livereload());
}

export default app;
