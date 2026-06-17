import {AsyncLocalStorage} from "node:async_hooks";
import axios from "#node_modules/axios";

export const securityContext = new AsyncLocalStorage<string>();

axios.interceptors.request.use(
    (config) => {
        const token = securityContext.getStore();

        if (token) {
            config.headers.set("Authorization", `Bearer ${token}`);
            config.headers.set("Content-Type", "application/json");
            config.headers.set("Accept", "application/json");

            // 🎯 PROOF OF OUTBOUND TOKEN
            /* eslint-disable no-console */
            console.log("\n" + "🚀".repeat(25));
            console.log(`📤 OUTBOUND REQUEST TO: ${config.baseURL || ""}${config.url}`);
            console.log("🎫 ATTACHED BEARER TOKEN:");
            console.log(token);
            console.log("🚀".repeat(25) + "\n");
            /* eslint-enable no-console */
        }
        return config;
    },
    async (error) => await Promise.reject(error)
);