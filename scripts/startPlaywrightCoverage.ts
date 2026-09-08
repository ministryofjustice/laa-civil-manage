/* eslint-disable no-console -- Coverage startup and shutdown must report directly. */
import path from "node:path";
import { pathToFileURL } from "node:url";
import { writeCoverage } from "#scripts/coverageTools/writeCoverage.js";

const coverageDirectory = path.resolve("coverage/playwright/raw");
const coverageServerPort = 3001;
let coverageWritten = false;

const persistCoverage = (): void => {
  if (coverageWritten) return;
  writeCoverage(
    coverageDirectory,
    `coverage-${process.pid}.json`,
    "Playwright server",
  );
  coverageWritten = true;
};

const shutdown = (): void => {
  try {
    if (!coverageWritten) persistCoverage();
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
      persistCoverage();
      return new Response(null, { status: 204 });
    } catch (error) {
      console.error("Failed to write Playwright coverage:", error);
      return new Response("Failed to write coverage", { status: 500 });
    }
  },
});

await import(pathToFileURL(path.resolve("public/index.js")).href);
