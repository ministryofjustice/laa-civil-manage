import { config } from "#src/config.js";
import app from "#src/app.js";
import { logger } from "#src/utils/logger.js";

app.listen(config.app.port, () => {
  logger.logInfo("Server Init", `Listening on port ${config.app.port}...`);
});
