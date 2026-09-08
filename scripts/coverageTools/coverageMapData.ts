import type { CoverageMapData, FileCoverageData } from "istanbul-lib-coverage";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFileCoverageData = (value: unknown): value is FileCoverageData =>
  isRecord(value) &&
  typeof value.path === "string" &&
  isRecord(value.statementMap) &&
  isRecord(value.fnMap) &&
  isRecord(value.branchMap) &&
  isRecord(value.s) &&
  isRecord(value.f) &&
  isRecord(value.b);

const isCoverageMapData = (value: unknown): value is CoverageMapData =>
  isRecord(value) && Object.values(value).every(isFileCoverageData);

const parseCoverageMapData = (source: string): CoverageMapData => {
  const coverageData: unknown = JSON.parse(source);

  if (!isCoverageMapData(coverageData)) {
    throw new Error("Invalid Istanbul coverage data.");
  }

  return coverageData;
};

export { parseCoverageMapData };
