import { AsyncLocalStorage } from "node:async_hooks";
import axios from "#node_modules/axios";

export const securityContext = new AsyncLocalStorage<string>();

axios.interceptors.request.use(
    (config) => {
        const token = securityContext.getStore();

        if (token) {
            config.headers.set("Authorization", `Bearer ${token}`);
            config.headers.set("Content-Type", "application/json");
            config.headers.set("Accept", "application/json");
        }
        return config;
    },
    async (error) => await Promise.reject(error)
);