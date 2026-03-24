import { setupMiddlewares } from "#src/middleware/commonMiddleware.js";
import express from "express";
import { describe, it, expect } from "bun:test";

describe("setupMiddlewares", () => {
  it("should set up middleware without throwing an error", () => {
    const app = express();
    expect(() => {
      setupMiddlewares(app);
    }).not.toThrow();
  });
});
