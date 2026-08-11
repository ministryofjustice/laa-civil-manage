import { formatPostcode } from "#src/utils/priorAuthority/expert/formatPostcode.js";
import { describe, expect, it } from "bun:test";

describe("formatPostcode", () => {
  it("uppercases and inserts a space before the inward code", () => {
    expect(formatPostcode("sw1a1aa")).toBe("SW1A 1AA");
  });

  it("collapses existing whitespace to a single space", () => {
    expect(formatPostcode("sw1a   1aa")).toBe("SW1A 1AA");
  });

  it("trims surrounding whitespace", () => {
    expect(formatPostcode("  sw1a 1aa  ")).toBe("SW1A 1AA");
  });

  it("formats the shortest valid postcodes", () => {
    expect(formatPostcode("m11aa")).toBe("M1 1AA");
  });

  it("formats the longest valid postcodes", () => {
    expect(formatPostcode("ec1a1bb")).toBe("EC1A 1BB");
  });

  it("returns the cleaned uppercase value when too short to format", () => {
    expect(formatPostcode("ab1")).toBe("AB1");
  });

  it("returns the cleaned uppercase value when too long to format", () => {
    expect(formatPostcode("abcd1234ef")).toBe("ABCD1234EF");
  });

  it("returns an empty string for empty input", () => {
    expect(formatPostcode("   ")).toBe("");
  });
});
