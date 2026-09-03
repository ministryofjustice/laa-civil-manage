import { afterAll } from "bun:test";
import path from "node:path";
import { createIstanbulPlugin } from "#scripts/coverageTools/istanbulPlugin.js";
import { writeCoverage } from "#scripts/coverageTools/writeCoverage.js";

// Bun's onLoad transform makes follow-redirects initialize with stricter stack
// trace semantics, so load this dependency before registering the transform.
await import("axios");

void Bun.plugin(createIstanbulPlugin());

afterAll(() => {
  writeCoverage(
    path.resolve("coverage/unit/raw"),
    `coverage-${process.pid}.json`,
    "Unit tests",
  );
});
