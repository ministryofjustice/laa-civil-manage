import type jwksClient from "jwks-rsa";

export type JwksClientFunction = (
  options: jwksClient.Options,
) => jwksClient.JwksClient;
