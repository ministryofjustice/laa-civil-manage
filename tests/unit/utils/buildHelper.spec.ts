import fs from "node:fs";
import { getBuildNumber, getLatestBuildFile } from "#src/utils/buildHelper.js";
import {
  describe,
  it,
  beforeEach,
  afterEach,
  mock,
  expect,
  spyOn,
  type Mock,
} from "bun:test";

describe("buildHelper", () => {
  describe("getBuildNumber", () => {
    it("should return a string of digits", () => {
      const result = getBuildNumber();
      expect(result).toMatch(/^\d+$/);
    });

    it("should return a number less than 10000", () => {
      const num = parseInt(getBuildNumber(), 10);
      expect(num).toBeLessThan(10000);
    });
  });

  describe("getLatestBuildFile", () => {
    let readdirSpy: Mock<(...args: unknown[]) => string[]>;

    beforeEach(() => {
      readdirSpy = spyOn(fs, "readdirSync") as unknown as Mock<
        (...args: unknown[]) => string[]
      >;
    });

    afterEach(() => {
      mock.restore();
    });

    it("should return the first matching file", () => {
      readdirSpy.mockReturnValue([
        "main.123.js",
        "main.456.js",
        "notmain.789.js",
        "main.css",
      ]);

      const result = getLatestBuildFile("public/js", "main", "js");
      expect(result).toBe("main.123.js");
    });

    it("should return an empty string if no matches found", () => {
      readdirSpy.mockReturnValue(["other.123.js", "file.css", "main.js"]);

      const result = getLatestBuildFile("public/js", "main", "js");
      expect(result).toBe("");
    });

    it("should match based on dynamic prefix and extension", () => {
      readdirSpy.mockReturnValue([
        "style.987.css",
        "style.999.css",
        "main.001.js",
      ]);
      const result = getLatestBuildFile("public/css", "style", "css");
      expect(result).toBe("style.987.css");
    });
  });
});
