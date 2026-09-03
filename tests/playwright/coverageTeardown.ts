const persistCoverage = async (): Promise<void> => {
  const response = await fetch("http://127.0.0.1:3001/coverage", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to persist Playwright coverage: ${response.status} ${response.statusText}`,
    );
  }
};

export default persistCoverage;
