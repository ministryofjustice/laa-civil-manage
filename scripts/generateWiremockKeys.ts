import crypto from "node:crypto";
import fs from "node:fs";
import jwt from "jsonwebtoken";

const HTTPS_BASE = "https://127.0.0.1:8443/mock-entra";

// 1. Generate RSA Keypair
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "jwk" },
  privateKeyEncoding: { type: "pkcs1", format: "pem" },
});

// 2. Sign fake JWT
const idToken = jwt.sign(
  {
    oid: "test-user-id",
    tid: "mock-tenant-id",
    name: "Playwright Test User",
    preferred_username: "playwright.test@example.com",
  },
  privateKey,
  {
    algorithm: "RS256",
    expiresIn: "100y",
    keyid: "mock-key-id",
    audience: "test-client-id",
    issuer: `${HTTPS_BASE}/v2.0`,
  },
);

// 3. Base64-encoded client_info payload
const mockClientInfo = Buffer.from(
  JSON.stringify({ uid: "test-user-id", utid: "mock-tenant-id" }),
).toString("base64");

// 4. Mapping: JWKS Public Keys
const jwksMapping = {
  request: { method: "GET", urlPathPattern: "/mock-entra/discovery/v2.0/keys" },
  response: {
    status: 200,
    headers: { "Content-Type": "application/json" },
    jsonBody: {
      keys: [
        {
          kty: "RSA",
          use: "sig",
          kid: "mock-key-id",
          alg: "RS256",
          n: publicKey.n,
          e: publicKey.e,
        },
      ],
    },
  },
};

// 5. Mapping: OAuth Authorize Endpoint
const authorizeMapping = {
  request: {
    method: "GET",
    urlPathPattern: "/mock-entra/oauth2/v2.0/authorize",
  },
  response: {
    status: 302,
    headers: {
      Location:
        "http://127.0.0.1:3000/auth/redirect?code=mock_auth_code&state={{{request.query.state}}}",
    },
    transformers: ["response-template"],
  },
};

// 6. Mapping: Token Exchange Endpoint
const tokenMapping = {
  request: { method: "POST", urlPathPattern: "/mock-entra/oauth2/v2.0/token" },
  response: {
    status: 200,
    headers: { "Content-Type": "application/json" },
    jsonBody: {
      token_type: "Bearer",
      expires_in: 3599,
      access_token: ["mock", "access", "token"].join("-"),
      id_token: idToken,
      client_info: mockClientInfo,
      account: { localAccountId: "test-user-id", name: "Playwright Test User" },
    },
  },
};

// 7. Mapping: OpenID Discovery Document
const discoveryMapping = {
  request: {
    method: "GET",
    urlPattern: "/mock-entra.*openid-configuration",
  },
  response: {
    status: 200,
    headers: { "Content-Type": "application/json" },
    jsonBody: {
      issuer: `${HTTPS_BASE}/v2.0`,
      authorization_endpoint: `${HTTPS_BASE}/oauth2/v2.0/authorize`,
      token_endpoint: `${HTTPS_BASE}/oauth2/v2.0/token`,
      jwks_uri: `${HTTPS_BASE}/discovery/v2.0/keys`,
      response_types_supported: ["code", "id_token", "token"],
      subject_types_supported: ["pairwise"],
      id_token_signing_alg_values_supported: ["RS256"],
    },
  },
};

fs.writeFileSync(
  "tests/resources/wiremock/entra-jwks.json",
  JSON.stringify(jwksMapping, null, 2),
);
fs.writeFileSync(
  "tests/resources/wiremock/entra-authorize.json",
  JSON.stringify(authorizeMapping, null, 2),
);
fs.writeFileSync(
  "tests/resources/wiremock/entra-token.json",
  JSON.stringify(tokenMapping, null, 2),
);
fs.writeFileSync(
  "tests/resources/wiremock/entra-discovery.json",
  JSON.stringify(discoveryMapping, null, 2),
);

// eslint-disable-next-line no-console -- CLI task script requires user feedback output
console.log("✅ Updated Wiremock OAuth mappings!");
