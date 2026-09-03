/* eslint-disable no-console -- This command reports merged coverage output. */
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { createCoverageMap } from "istanbul-lib-coverage";
import { parseCoverageMapData } from "#scripts/coverageTools/coverageMapData.js";

const inputDirectories = [
  path.resolve("coverage/unit/raw"),
  path.resolve("coverage/playwright/raw"),
];
const outputDirectory = path.resolve("coverage/combined/raw");
const coverageMap = createCoverageMap({});

const findCoverageFiles = async (directory: string): Promise<string[]> => {
  const filenames = await readdir(directory);
  const jsonFiles = filenames.filter((filename) => filename.endsWith(".json"));

  if (jsonFiles.length === 0) {
    throw new Error(`No coverage data found in ${directory}.`);
  }

  return jsonFiles.map((filename) => path.join(directory, filename));
};

const coverageFiles = (
  await Promise.all(inputDirectories.map(findCoverageFiles))
).flat();
const coverageData = await Promise.all(
  coverageFiles.map(async (filename) =>
    parseCoverageMapData(await Bun.file(filename).text()),
  ),
);

for (const data of coverageData) {
  coverageMap.merge(data);
}

await mkdir(outputDirectory, { recursive: true });
await Bun.write(
  path.join(outputDirectory, "coverage.json"),
  JSON.stringify(coverageMap.toJSON()),
);

console.log(`Merged coverage for ${coverageMap.files().length} source files.`);
