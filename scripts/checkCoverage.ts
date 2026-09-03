/* eslint-disable no-console -- This command reports coverage results to the terminal. */

interface CoverageMetric {
  label: string;
  percentage: number;
  threshold: number;
}

const coverageProcess = Bun.spawn(["bun", "run", "coverage:unit"], {
  stdout: "pipe",
  stderr: "pipe",
});

const [stdout, stderr, exitCode] = await Promise.all([
  new Response(coverageProcess.stdout).text(),
  new Response(coverageProcess.stderr).text(),
  coverageProcess.exited,
]);

process.stdout.write(stdout);
process.stderr.write(stderr);

if (exitCode !== 0) {
  process.exitCode = exitCode;
} else {
  const summary =
    /^All files\s+\|\s+(?<functions>\d+(?:\.\d+)?)\s+\|\s+(?<lines>\d+(?:\.\d+)?)/mv.exec(
      `${stdout}\n${stderr}`,
    );

  if (summary?.groups === undefined) {
    throw new Error("Unable to find the aggregate coverage result.");
  }

  const metrics: CoverageMetric[] = [
    {
      label: "Lines",
      percentage: Number(summary.groups.lines),
      threshold: 93,
    },
    {
      label: "Functions",
      percentage: Number(summary.groups.functions),
      threshold: 91,
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
}
