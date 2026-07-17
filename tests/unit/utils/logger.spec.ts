import { describe, it, expect } from "bun:test";
import type { DestinationStream } from "pino";
import { Logger, createBaseLogger } from "#src/utils/logger.js";
import { requestContext } from "#src/utils/requestContext.js";

function capture(): { lines: string[]; stream: DestinationStream } {
  const lines: string[] = [];
  const stream = {
    write: (msg: string): boolean => {
      lines.push(msg);
      return true;
    },
  } as unknown as DestinationStream;
  return { lines, stream };
}

const parseLast = (lines: string[]): Record<string, unknown> =>
  JSON.parse(lines[lines.length - 1]) as Record<string, unknown>;

describe("logger", () => {
  it("emits structured JSON with the guardrail field contract", () => {
    const { lines, stream } = capture();
    const logger = new Logger(createBaseLogger(stream));

    logger.logInfo("myFunction", "something happened");

    const entry = parseLast(lines);
    expect(entry.level).toBe("info");
    expect(entry.message).toBe("something happened");
    expect(typeof entry.serviceName).toBe("string");
    expect(typeof entry.environment).toBe("string");
    expect(entry.context).toEqual({
      userId: "none",
      functionName: "myFunction",
    });
    expect(typeof entry.timestamp).toBe("string");
    expect(entry.timestamp as string).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
  });

  it("includes the correlation ID and user id from the request context", () => {
    const { lines, stream } = capture();
    const logger = new Logger(createBaseLogger(stream));

    requestContext.run(
      { correlationId: "corr-123", getUserId: () => "user-9" },
      () => {
        logger.logInfo("fn", "in context");
      },
    );

    const entry = parseLast(lines);
    expect(entry.correlationId).toBe("corr-123");
    expect(entry.context).toEqual({ userId: "user-9", functionName: "fn" });
  });

  it("omits the correlation ID for non-request (startup) logs", () => {
    const { lines, stream } = capture();
    const logger = new Logger(createBaseLogger(stream));

    logger.logInfo("Server Init", "listening");

    expect(parseLast(lines).correlationId).toBeUndefined();
  });

  it("supports warn and error levels", () => {
    const { lines, stream } = capture();
    const logger = new Logger(createBaseLogger(stream));

    logger.logWarn("fn", "careful");
    expect(parseLast(lines).level).toBe("warn");

    logger.logError("fn", "boom");
    expect(parseLast(lines).level).toBe("error");
  });

  it("logs axios errors by status only, never the raw response body", () => {
    const { lines, stream } = capture();
    const logger = new Logger(createBaseLogger(stream));

    const axiosError = {
      isAxiosError: true,
      code: "ERR_BAD_RESPONSE",
      response: {
        status: 502,
        statusText: "Bad Gateway",
        data: { applicantName: "Jane Doe", secret: "should-not-appear" },
      },
    };

    logger.logError("fetch", "Failed to fetch applications", axiosError);

    const entry = parseLast(lines);
    expect(entry.message).toContain("HTTP 502");
    expect(JSON.stringify(entry)).not.toContain("should-not-appear");
    expect(JSON.stringify(entry)).not.toContain("Jane Doe");
  });

  it("redacts sensitive fields defensively", () => {
    const { lines, stream } = capture();
    const base = createBaseLogger(stream);

    base.info(
      { context: { accessToken: "s3cr3t-token", functionName: "x" } },
      "with token",
    );

    const entry = parseLast(lines);
    expect((entry.context as Record<string, unknown>).accessToken).toBe(
      "[REDACTED]",
    );
    expect(JSON.stringify(entry)).not.toContain("s3cr3t-token");
  });
});
