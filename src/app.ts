import express from "express";
import session from "express-session";
import { config } from "#src/config.js";
import indexRouter from "#src/routes/indexRouter.js";
import SessionManager from "#/src/middleware/session/sessionManager.js";
import { getSessionUrl } from "#/src/middleware/session/sessionHandler.js";
import { setupMiddlewares } from "#src/middleware/commonMiddleware.js";
import { nunjucksSetup } from "#src/utils/nunjucksSetup.js";
import { setupHelmet } from "#src/utils/setupHelmet.js";

import {
  routeNotFound,
  serverErrors,
} from "#src/controllers/errorController.js";
import { setupCsrf } from "#src/middleware/setupCsrf.js";
import { rateLimiter } from "#src/middleware/rateLimiter.js";

const app = express();
const sessionManager = new SessionManager();
const sessionConfig = await sessionManager.getSessionConfig(config.session);

app.use(session(sessionConfig));
app.use(rateLimiter);
setupHelmet(app);

nunjucksSetup(app);
setupMiddlewares(app);
setupCsrf(app);

app.set("trust proxy", 1);
app.use(getSessionUrl);
app.use(indexRouter);

app.all("{*splat}", routeNotFound);
app.use(serverErrors);

export default app;
