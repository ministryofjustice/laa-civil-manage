import type { Request } from "express";
import jwt, { type Algorithm } from "jsonwebtoken";
import { SigningError, VerifyError } from "#src/types/errors.js";
import { logger } from "#src/utils/logger.js";
import type { JwksClientFunction } from "#src/types/sessions.js";

const VALID_ALGORITHMS = new Set<string>([
  "HS256",
  "HS384",
  "HS512",
  "RS256",
  "RS384",
  "RS512",
  "ES256",
  "ES384",
  "ES512",
  "PS256",
  "PS384",
  "PS512",
  "none",
]);

function isAlgorithm(alg: string): alg is Algorithm {
  return VALID_ALGORITHMS.has(alg);
}

export default async function verifyToken(
  req: Request,
  token: string,
  jwksClient: JwksClientFunction,
): Promise<boolean> {
  try {
    const decodedJwt = jwt.decode(token, { complete: true });

    logger.logInfo("Verify JWT", `Decoded JWT: ${JSON.stringify(decodedJwt)}`);

    if (decodedJwt == null) {
      throw new Error("Failed to Decode Token");
    }

    const publicKey = await getPublicKey(decodedJwt, jwksClient);
    verifyAgainstPublicKey(token, publicKey, decodedJwt);
    return true;
  } catch (error) {
    let errorMessage = "An error occured decoding the token";
    if (error instanceof SigningError) {
      errorMessage = "An error occured getting the signing key";
    } else if (error instanceof VerifyError) {
      errorMessage = "An error occured verifying the token";
    }
    logger.logError("Verify JWT", errorMessage, error, req);
    return false;
  }
}

function verifyAgainstPublicKey(
  token: string,
  publicKey: string,
  decodedJwt: jwt.Jwt,
): void {
  try {
    const alg = decodedJwt.header.alg;
    if (typeof alg !== "string" || !isAlgorithm(alg)) {
      throw new VerifyError("Invalid algorithm in JWT header");
    }

    jwt.verify(token, publicKey, {
      algorithms: [alg],
    });
  } catch (error: unknown) {
    let message = "Unknown Error";
    if (error instanceof Error) {
      message = error.message;
    }
    throw new VerifyError(message);
  }
}

async function getPublicKey(
  decodedJwt: jwt.Jwt,
  jwksClient: JwksClientFunction,
): Promise<string> {
  try {
    if (typeof decodedJwt.payload === "string") {
      throw new SigningError("Payload must be an object");
    }
    const jwtPayload = decodedJwt.payload;
    if (typeof jwtPayload.tid !== "string" || !jwtPayload.tid) {
      throw new SigningError("Missing tid in JWT payload");
    }
    const client = jwksClient({
      jwksUri: `https://login.microsoftonline.com/${jwtPayload.tid}/discovery/keys`,
    });
    const signingKey = await client.getSigningKey(decodedJwt.header.kid);
    return signingKey.getPublicKey();
  } catch (error: unknown) {
    let message = "Unknown Error";
    if (error instanceof Error) {
      message = error.message;
    }
    throw new SigningError(message);
  }
}
