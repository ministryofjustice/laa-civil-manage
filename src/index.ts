import { config } from "#config.js";
import app from "#src/app.js";
import chalk from "chalk";
import { logger } from "#src/utils/logger.js";

app.listen(config.app.port, () => {
  logger.logInfo(
    "Server Init",
    chalk.yellow(`Listening on port ${config.app.port}...`),
  );
});
