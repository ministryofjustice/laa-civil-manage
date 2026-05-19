import { a11yPages } from "#src/utils/a11yPages.js";
import { describe, expect, it } from "bun:test";

describe("a11yPages", () => {
  it("includes known pa-form pages", () => {
    expect(a11yPages).toContain("/");
    expect(a11yPages).toContain("/pa-form/start-page");
    expect(a11yPages).toContain("/pa-form/document-upload");
  });

  it("excludes technical endpoints", () => {
    expect(a11yPages).not.toContain("/status");
    expect(a11yPages).not.toContain("/health");
    expect(a11yPages).not.toContain("/error");
    expect(a11yPages).not.toContain("/applications");
  });

  it("does not include duplicate paths", () => {
    expect(new Set(a11yPages).size).toBe(a11yPages.length);
  });
});
