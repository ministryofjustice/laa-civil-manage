import crypto from "node:crypto";

// This must exactly match the secret in your .env file
const HANDOFF_SECRET = "12345678901234567890123456789012";
const emailToTest = "Jonathan.Woolcock-LAA-provider1-test@devl.justice.gov.uk";

// 1. Generate a random Initialization Vector (IV)
const iv = crypto.randomBytes(16);

// 2. Create the cipher
const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(HANDOFF_SECRET, "utf8"),
    iv
);

// 3. Encrypt the email
let ciphertext = cipher.update(emailToTest, "utf8");
ciphertext = Buffer.concat([ciphertext, cipher.final()]);

// 4. Get the Auth Tag
const authTag = cipher.getAuthTag();

// 5. Combine into a single buffer: IV (16) + AuthTag (16) + Ciphertext
const combinedBuffer = Buffer.concat([iv, authTag, ciphertext]);

// 6. Base64 encode it so it is URL-safe
const token = combinedBuffer.toString("base64url");


console.log(`http://localhost:3000/auth/login?token=${token}`);