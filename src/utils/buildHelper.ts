import fs from "node:fs";
import path from "node:path";

const FIRST_IN_ARRAY = 0;

/**
 * Generate a random build number as a string.
 * @returns {string} - A random build number.
 */
export const getBuildNumber = (): string =>
  Math.floor(Math.random() * 10000).toString();

/**
 * Get the latest build file from the specified directory.
 * @param {string} directory - The directory to search in.
 * @param {string} prefix - The prefix of the build files.
 * @param {string} extension - The extension of the build files.
 * @returns {string} - The name of the latest build file or an empty string if none found.
 */
export const getLatestBuildFile = (
  directory: string,
  prefix: string,
  extension: string,
): string => {
  const files = fs.readdirSync(directory);
  const pattern = new RegExp(`^${prefix}\\.\\d+\\.${extension}$`, "v");
  const matchingFiles = files
    .filter((file) => pattern.test(file))
    .sort((a, b) => {
      const aTime = fs.statSync(path.join(directory, a)).mtimeMs;
      const bTime = fs.statSync(path.join(directory, b)).mtimeMs;
      return bTime - aTime;
    });
  return matchingFiles.length > FIRST_IN_ARRAY
    ? matchingFiles[FIRST_IN_ARRAY]
    : "";
};
