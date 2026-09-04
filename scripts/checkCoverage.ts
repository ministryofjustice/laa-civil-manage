/* eslint-disable no-console -- This command reports coverage results to the terminal. */
import { createCoverageMap } from "istanbul-lib-coverage";
import { parseCoverageMapData } from "#scripts/coverageTools/coverageMapData.js";

interface CoverageMetric {
  label: string;
  percentage: number;
  threshold: number;
}

const COVERAGE_THRESHOLDS = {
  linesPercentage: 89,
  functionsPercentage: 91,
} as const;

const coverageData = parseCoverageMapData(
  await Bun.file("coverage/combined/raw/coverage.json").text(),
);
const summary = createCoverageMap(coverageData).getCoverageSummary();

const metrics: CoverageMetric[] = [
  {
    label: "Lines",
    percentage: summary.lines.pct,
    threshold: COVERAGE_THRESHOLDS.linesPercentage,
  },
  {
    label: "Functions",
    percentage: summary.functions.pct,
    threshold: COVERAGE_THRESHOLDS.functionsPercentage,
  },
];
let failed = false;

console.log("\nCoverage thresholds:");

for (const metric of metrics) {
  const passed = metric.percentage >= metric.threshold;

  console.log(
    `${passed ? "PASS" : "FAIL"} ${metric.label}: ${metric.percentage.toFixed(2)}% (required: ${metric.threshold.toFixed(2)}%)`,
  );

  failed ||= !passed;
}

if (failed) {
  console.error("\nCoverage is below the required threshold.");
  process.exitCode = 1;
}
