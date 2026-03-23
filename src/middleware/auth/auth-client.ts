import * as msal from "@azure/msal-node";
import { config } from "#src/config.js";
import { logger } from "#src/utils/logger.js";

const msalConfig = {
  auth: {
    clientId: config.auth.clientId,
    authority: config.auth.authDirectory,
    clientSecret: config.auth.clientSecret,
    redirectUri: config.auth.redirectUri,
  },
  system: {
    loggerOptions: {
      loggerCallback: (
        level: msal.LogLevel,
        message: string,
        containsPii: boolean,
      ) => {
        if (!containsPii) {
          logger.logInfo("Auth Client", message);
        }
      },
      logLevel: msal.LogLevel.Warning,
    },
    cache: {
      cacheLocation: "memoryStorage", // Use in-memory cache for Node.js
      storeAuthStateInCookie: true, // Store the auth state in cookies for persistence
    },
  },
};

const msalClient = new msal.ConfidentialClientApplication(msalConfig)
  // config.app.environment !== "development"
  //   ? new msal.ConfidentialClientApplication(msalConfig)
  //   : // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-type-assertion -- Mock client for dev envs
  //     ({} as msal.ConfidentialClientApplication);

export default msalClient;
