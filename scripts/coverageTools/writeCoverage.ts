import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { CoverageMapData } from "istanbul-lib-coverage";

declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Istanbul's fixed coverage global.
  var __coverage__: CoverageMapData | undefined;
}

const writeCoverage = (
  directory: string,
  filename: string,
  source: string,
): void => {
  const { __coverage__: coverage } = globalThis;

  if (coverage === undefined) {
    throw new Error(`${source} did not produce coverage data.`);
  }

  mkdirSync(directory, { recursive: true });
  writeFileSync(path.join(directory, filename), JSON.stringify(coverage));
};

export { writeCoverage };
