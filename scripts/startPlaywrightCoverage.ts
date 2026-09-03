/* eslint-disable no-console -- Coverage startup and shutdown must report directly. */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Istanbul's fixed coverage global.
  var __coverage__: Record<string, unknown> | undefined;
}

const coverageDirectory = path.resolve("coverage/playwright/raw");
const coverageServerPort = 3001;
let coverageWritten = false;

const writeCoverage = (): void => {
  if (coverageWritten) return;

  const { __coverage__: coverage } = globalThis;

  if (coverage === undefined) {
    throw new Error("The Playwright server did not produce coverage data.");
  }

  mkdirSync(coverageDirectory, { recursive: true });
  writeFileSync(
    path.join(coverageDirectory, `coverage-${process.pid}.json`),
    JSON.stringify(coverage),
  );
  coverageWritten = true;
};

const shutdown = (): void => {
  try {
    if (!coverageWritten) writeCoverage();
    process.exit(0);
  } catch (error) {
    console.error("Failed to write Playwright coverage:", error);
    process.exit(1);
  }
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

Bun.serve({
  hostname: "127.0.0.1",
  port: coverageServerPort,
  fetch(request) {
    const { pathname } = new URL(request.url);

    if (request.method !== "POST" || pathname !== "/coverage") {
      return new Response("Not found", { status: 404 });
    }

    try {
      writeCoverage();
      return new Response(null, { status: 204 });
    } catch (error) {
      console.error("Failed to write Playwright coverage:", error);
      return new Response("Failed to write coverage", { status: 500 });
    }
  },
});

await import(pathToFileURL(path.resolve("public/index.js")).href);
