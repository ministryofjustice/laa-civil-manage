import { generateKeyPairSync } from "node:crypto";
import jwt from "jsonwebtoken";
import { describe, it, expect, mock } from "bun:test";
import type { Request } from "express";
import verifyToken from "#src/middleware/auth/verifyToken.js";
import { config } from "#src/config.js";
import type { JwksClientFunction } from "#src/types/sessions.js";

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const req = { session: {} } as unknown as Request;

const makeJwksStub = (): {
  jwksMock: ReturnType<typeof mock>;
  jwksStub: JwksClientFunction;
} => {
  const jwksMock = mock((_options: { jwksUri: string }) => ({
    getSigningKey: async () =>
      await Promise.resolve({ getPublicKey: () => publicKey }),
  }));
  return { jwksMock, jwksStub: jwksMock as unknown as JwksClientFunction };
};

const signRs256 = (
  payload: Record<string, unknown>,
  audience: string,
): string =>
  jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    audience,
    keyid: "kid-1",
    expiresIn: "1h",
  });

describe("verifyToken", () => {
  it("returns true for a valid RS256 token with the correct audience", async () => {
    const { jwksStub } = makeJwksStub();
    const token = signRs256({ tid: "tenant-a" }, config.auth.clientId);

    expect(await verifyToken(req, token, jwksStub)).toBe(true);
  });

  it("pins the JWKS URI to the configured tenant, not the token's tid", async () => {
    const { jwksMock, jwksStub } = makeJwksStub();
    const token = signRs256({ tid: "attacker-tenant" }, config.auth.clientId);

    await verifyToken(req, token, jwksStub);

    const firstCall = jwksMock.mock.calls[0][0] as { jwksUri: string };
    expect(firstCall.jwksUri).toBe(
      `${config.auth.authDirectory}/discovery/keys`,
    );
  });

  it("rejects a token signed with HS256 (no RS256->HS256 confusion)", async () => {
    const { jwksStub } = makeJwksStub();
    // Attacker signs with HS256 using the public key as the shared secret.
    const token = jwt.sign({ tid: "tenant-a" }, publicKey, {
      algorithm: "HS256",
      audience: config.auth.clientId,
      keyid: "kid-1",
      expiresIn: "1h",
    });

    expect(await verifyToken(req, token, jwksStub)).toBe(false);
  });

  it("rejects an unsigned alg:none token", async () => {
    const { jwksStub } = makeJwksStub();
    const b64 = (value: object): string =>
      Buffer.from(JSON.stringify(value)).toString("base64url");
    const noneToken = `${b64({ alg: "none", typ: "JWT", kid: "kid-1" })}.${b64({
      aud: config.auth.clientId,
    })}.`;

    expect(await verifyToken(req, noneToken, jwksStub)).toBe(false);
  });

  it("rejects a token minted for a different audience", async () => {
    const { jwksStub } = makeJwksStub();
    const token = signRs256({ tid: "tenant-a" }, "some-other-app");

    expect(await verifyToken(req, token, jwksStub)).toBe(false);
  });

  it("rejects an expired token", async () => {
    const { jwksStub } = makeJwksStub();
    const token = jwt.sign({ tid: "tenant-a" }, privateKey, {
      algorithm: "RS256",
      audience: config.auth.clientId,
      keyid: "kid-1",
      expiresIn: "-1h",
    });

    expect(await verifyToken(req, token, jwksStub)).toBe(false);
  });

  it("returns false when the token cannot be decoded", async () => {
    const { jwksStub } = makeJwksStub();

    expect(await verifyToken(req, "not-a-jwt", jwksStub)).toBe(false);
  });
});
