/* eslint-disable no-console -- ignore console error*/
import { config } from "#config.js";
import app from "#src/app.js";
import chalk from "chalk";

app.listen(config.app.port, () => {
  console.log(chalk.yellow(`Listening on port ${config.app.port}...`));
});
