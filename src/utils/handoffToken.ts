import crypto from "node:crypto";
import { logger } from "#src/utils/logger.js";

const HANDOFF_SECRET =
  process.env.HANDOFF_SECRET || "12345678901234567890123456789012";

/**
 * Decrypts a Base64 encoded AES-256-GCM token
 */
export function decryptHandoffToken(base64Token: string): string | undefined {
  try {
    const buffer = Buffer.from(base64Token, "base64");

    // Standard AES-GCM buffer slicing: 16-byte IV, 16-byte Auth Tag, then the ciphertext
    const iv = buffer.subarray(0, 16);
    const authTag = buffer.subarray(16, 32);
    const ciphertext = buffer.subarray(32);

    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(HANDOFF_SECRET, "utf8"),
      iv,
    );
    decipher.setAuthTag(authTag);

    let decryptedEmail = decipher.update(ciphertext, undefined, "utf8");
    decryptedEmail += decipher.final("utf8");

    return decryptedEmail;
  } catch (error) {
    logger.logError("Auth", "Failed to decrypt handoff token", error);
    return undefined;
  }
}
