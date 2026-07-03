import type { Request } from "express";
import jwt from "jsonwebtoken";
import { config } from "#src/config.js";
import { SigningError, VerifyError } from "#src/utils/errors.js";
import { logger } from "#src/utils/logger.js";
import type { JwksClientFunction } from "#src/types/sessions.js";

// Entra ID signs tokens with RS256.
const ALLOWED_ALGORITHMS = ["RS256"] as const;

export default async function verifyToken(
  req: Request,
  token: string,
  jwksClient: JwksClientFunction,
): Promise<boolean> {
  try {
    const decodedJwt = jwt.decode(token, { complete: true });

    if (decodedJwt == null) {
      throw new Error("Failed to Decode Token");
    }

    const publicKey = await getPublicKey(decodedJwt, jwksClient);
    verifyAgainstPublicKey(token, publicKey);
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

function verifyAgainstPublicKey(token: string, publicKey: string): void {
  try {
    // Restrict to RS256 and pin the audience to our app. Signing keys are also
    // pinned to our tenant (see getPublicKey), so a correctly-signed token from
    // another tenant or another app cannot pass verification.
    jwt.verify(token, publicKey, {
      algorithms: [...ALLOWED_ALGORITHMS],
      audience: config.auth.clientId,
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
    if (config.auth.authDirectory == null || config.auth.authDirectory === "") {
      throw new SigningError("AUTH_DIRECTORY_URL is not configured");
    }
    const client = jwksClient({
      jwksUri: `${config.auth.authDirectory}/discovery/keys`,
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
