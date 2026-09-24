import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ZAP_TENANT = "zap-tenant";

const BASE = "https://wiremock:8443/mock-entra";
const ISSUER = `${BASE}/${ZAP_TENANT}/v2.0`;
const CLIENT_ID = "zap-mock-client";
const API_AUDIENCE = "zap-api-audience";
const KEY_ID = "zap-mock-key-id";
const FRONTEND_REDIRECT_URL = "http://civil-manage:3000/auth/redirect";

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function signMockToken(privateKey: string, audience: string): string {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const oneHundredYearsInSeconds = 60 * 60 * 24 * 365 * 100;

  const header = { alg: "RS256", typ: "JWT", kid: KEY_ID };
  const payload = {
    sub: "zap-test-user-id",
    oid: "zap-test-user-id",
    tid: ZAP_TENANT,
    name: "ZAP Scan User",
    preferred_username: "zap.scan@example.com",
    iat: nowSeconds,
    exp: nowSeconds + oneHundredYearsInSeconds,
    aud: audience,
    iss: ISSUER,
  };

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = crypto.sign(
    "RSA-SHA256",
    Buffer.from(signingInput),
    privateKey,
  );

  return `${signingInput}.${base64url(signature)}`;
}

const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "jwk" },
  privateKeyEncoding: { type: "pkcs1", format: "pem" },
});

const idToken = signMockToken(privateKey, CLIENT_ID);
const accessToken = signMockToken(privateKey, API_AUDIENCE);

const mockClientInfo = Buffer.from(
  JSON.stringify({ uid: "zap-test-user-id", utid: ZAP_TENANT }),
).toString("base64");

const jwksMapping = {
  priority: 1,
  request: {
    method: "GET",
    urlPathPattern: `/mock-entra/${ZAP_TENANT}/discovery/v2.0/keys`,
  },
  response: {
    status: 200,
    headers: { "Content-Type": "application/json" },
    jsonBody: {
      keys: [
        {
          kty: "RSA",
          use: "sig",
          kid: KEY_ID,
          alg: "RS256",
          n: publicKey.n,
          e: publicKey.e,
        },
      ],
    },
  },
};

const authorizeMapping = {
  priority: 1,
  request: {
    method: "GET",
    urlPathPattern: `/mock-entra/${ZAP_TENANT}/oauth2/v2.0/authorize`,
  },
  response: {
    status: 302,
    headers: {
      Location: `${FRONTEND_REDIRECT_URL}?code=mock_auth_code&state={{{request.query.state}}}`,
    },
    transformers: ["response-template"],
  },
};

const tokenMapping = {
  priority: 1,
  request: {
    method: "POST",
    urlPathPattern: `/mock-entra/${ZAP_TENANT}/oauth2/v2.0/token`,
  },
  response: {
    status: 200,
    headers: { "Content-Type": "application/json" },
    jsonBody: {
      token_type: "Bearer",
      expires_in: 3599,
      access_token: accessToken,
      id_token: idToken,
      client_info: mockClientInfo,
      account: { localAccountId: "zap-test-user-id", name: "ZAP Scan User" },
    },
  },
};

const discoveryMapping = {
  priority: 1,
  request: {
    method: "GET",
    urlPattern: `/mock-entra/${ZAP_TENANT}.*openid-configuration`,
  },
  response: {
    status: 200,
    headers: { "Content-Type": "application/json" },
    jsonBody: {
      issuer: ISSUER,
      authorization_endpoint: `${BASE}/${ZAP_TENANT}/oauth2/v2.0/authorize`,
      token_endpoint: `${BASE}/${ZAP_TENANT}/oauth2/v2.0/token`,
      jwks_uri: `${BASE}/${ZAP_TENANT}/discovery/v2.0/keys`,
      response_types_supported: ["code", "id_token", "token"],
      subject_types_supported: ["pairwise"],
      id_token_signing_alg_values_supported: ["RS256"],
    },
  },
};

const mappingsDir = path.resolve("tests/resources/wiremock");
fs.mkdirSync(mappingsDir, { recursive: true });

fs.writeFileSync(
  path.join(mappingsDir, "zap-entra-jwks.json"),
  JSON.stringify(jwksMapping, null, 2),
);
fs.writeFileSync(
  path.join(mappingsDir, "zap-entra-authorize.json"),
  JSON.stringify(authorizeMapping, null, 2),
);
fs.writeFileSync(
  path.join(mappingsDir, "zap-entra-token.json"),
  JSON.stringify(tokenMapping, null, 2),
);
fs.writeFileSync(
  path.join(mappingsDir, "zap-entra-discovery.json"),
  JSON.stringify(discoveryMapping, null, 2),
);

// eslint-disable-next-line no-console -- CLI task script requires user feedback output
console.log(
  "Generated ZAP mock Entra WireMock mappings in tests/resources/wiremock",
);
