import type { BaseUrlMap } from "#src/types/base-url-map.js";

export interface AppConfig {
  port: number;
  environment: string;
  useHttps: boolean;
}

export interface PathsConfig {
  static: string;
}

export interface SessionConfig {
  secret: string;
  name: string;
  resave: boolean;
  saveUninitialized: boolean;
  maxAge: number;
  redis_url?: string;
}

export interface Auth {
  clientId: string;
  authDirectory: string | undefined;
  clientSecret: string;
  redirectUri: string;
}

export interface DataStoreUrlMap {
  urls: Record<string, string>;
  paths?: Record<string, string>;
}

export interface Config {
  base_url_map: BaseUrlMap;
  RATE_LIMIT_MAX: number;
  RATE_WINDOW_MS: number;
  SERVICE_NAME: string;
  WIREMOCK_URL: string;
  app: AppConfig;
  auth: Auth;
  session: SessionConfig;
  paths: PathsConfig;
}
