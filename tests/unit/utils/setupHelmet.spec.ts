import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { afterEach, describe, expect, it } from "bun:test";
import { setupHelmet } from "#src/utils/setupHelmet.js";

const originalNodeEnv = process.env.NODE_ENV;
const originalEnableHttpsEnforcement = process.env.ENABLE_HTTPS_ENFORCEMENT;

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
    baseUrl: `http://localhost:${address.port}`,
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
  const nonceMatch = /nonce="(?<temp1>[^"]+)"/.exec(html);

  if (nonceMatch?.groups?.temp1 === undefined) {
    throw new Error("Expected nonce in HTML response");
  }

  return nonceMatch.groups.temp1;
};

afterEach(() => {
  if (originalNodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = originalNodeEnv;
  }

  if (originalEnableHttpsEnforcement === undefined) {
    delete process.env.ENABLE_HTTPS_ENFORCEMENT;
  } else {
    process.env.ENABLE_HTTPS_ENFORCEMENT = originalEnableHttpsEnforcement;
  }
});

describe("setupHelmet", () => {
  it("keeps CSP with nonce and rotates nonce per request", async () => {
    process.env.NODE_ENV = "development";
    process.env.ENABLE_HTTPS_ENFORCEMENT = "false";

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
    process.env.NODE_ENV = "production";
    process.env.ENABLE_HTTPS_ENFORCEMENT = "false";

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
    process.env.NODE_ENV = "development";
    process.env.ENABLE_HTTPS_ENFORCEMENT = "true";

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
