import * as msal from "@azure/msal-node";
import config from "#config.js";

const msalConfig = {
  auth: {
    clientId: config.auth.clientId,
    authority: config.auth.authDirectory,
    clientSecret: config.auth.clientSecret,
    redirectUri: config.auth.redirectUri,
  },
};

const msalClient = new msal.PublicClientApplication(msalConfig);

export default msalClient;
