import type { Request } from "express";
import jwt, { type Algorithm, type JwtPayload } from "jsonwebtoken";
import { SigningError, VerifyError } from "#src/types/errors.js";
import { logger } from "#src/utils/logger.js";
import type { JwksClientFunction } from "#src/types/sessions.js";

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
    jwt.verify(
      token,
      publicKey,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      { algorithms: [decodedJwt.header.alg as Algorithm] },
    );
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const jwtPayload = decodedJwt.payload as JwtPayload;
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
