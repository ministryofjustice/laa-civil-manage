import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { afterEach, describe, expect, it } from "bun:test";
import { config } from "#src/config.js";
import { setupHelmet } from "#src/utils/setupHelmet.js";

const originalEnableHttpsEnforcement = config.app.enableHttpsEnforcement;

const startServerWithHelmet = async (): Promise<{
  server: Server;
  baseUrl: string;
}> => {
  const app = express();
  setupHelmet(app);

  app.get("/", (_req, res) => {
    const nonce = res.locals.cspNonce;

    res
      .type("html")
      .send(
        `<!doctype html><html><body><script nonce="${nonce}">window.__nonceTest = true;</script></body></html>`,
      );
  });

  const server = createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      resolve();
    });
  });

  const address = server.address() as AddressInfo;

  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
};

const stopServer = async (server: Server): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error !== undefined) {
        reject(error);
        return;
      }

      resolve();
    });
  });
};

const getNonceFromHtml = (html: string): string => {
  const nonceMatch = /nonce="(?<nonce>[^"]+)"/.exec(html);

  if (nonceMatch?.groups?.nonce === undefined) {
    throw new Error("Expected nonce in HTML response");
  }

  return nonceMatch.groups.nonce;
};

afterEach(() => {
  config.app.enableHttpsEnforcement = originalEnableHttpsEnforcement;
});

describe("setupHelmet", () => {
  it("keeps CSP with nonce and rotates nonce per request", async () => {
    config.app.enableHttpsEnforcement = false;

    const { server, baseUrl } = await startServerWithHelmet();

    try {
      const firstResponse = await fetch(`${baseUrl}/`);
      const firstBody = await firstResponse.text();
      const firstNonce = getNonceFromHtml(firstBody);
      const firstCsp =
        firstResponse.headers.get("content-security-policy") ?? "";

      expect(firstCsp).toContain("script-src");
      expect(firstCsp).toContain(`'nonce-${firstNonce}'`);

      const secondResponse = await fetch(`${baseUrl}/`);
      const secondBody = await secondResponse.text();
      const secondNonce = getNonceFromHtml(secondBody);
      const secondCsp =
        secondResponse.headers.get("content-security-policy") ?? "";

      expect(secondCsp).toContain(`'nonce-${secondNonce}'`);
      expect(secondNonce).not.toBe(firstNonce);
    } finally {
      await stopServer(server);
    }
  });

  it("omits upgrade-insecure-requests and HSTS when HTTPS enforcement is disabled", async () => {
    config.app.enableHttpsEnforcement = false;

    const { server, baseUrl } = await startServerWithHelmet();

    try {
      const response = await fetch(`${baseUrl}/`);
      const csp = response.headers.get("content-security-policy") ?? "";
      const hsts = response.headers.get("strict-transport-security");

      expect(csp).not.toContain("upgrade-insecure-requests");
      expect(hsts).toBeNull();
    } finally {
      await stopServer(server);
    }
  });

  it("includes upgrade-insecure-requests and HSTS when HTTPS enforcement is enabled", async () => {
    config.app.enableHttpsEnforcement = true;

    const { server, baseUrl } = await startServerWithHelmet();

    try {
      const response = await fetch(`${baseUrl}/`);
      const csp = response.headers.get("content-security-policy") ?? "";
      const hsts = response.headers.get("strict-transport-security") ?? "";

      expect(csp).toContain("upgrade-insecure-requests");
      expect(hsts).toContain("max-age=");
    } finally {
      await stopServer(server);
    }
  });
});
