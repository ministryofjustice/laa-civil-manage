export interface Auth {
  clientId: string;
  authDirectory: string | undefined;
  clientSecret: string;
  redirectUri: string;
  logoutRedirectUri: string;
  apiScope: string;
}

export interface AppConfig {
  port: number;
  environment: string;
  appName: string;
  useHttps: boolean;
  enableHttpsEnforcement: boolean;
}

export interface CsrfConfig {
  cookieName: string;
  secure: boolean;
  httpOnly: boolean;
}

export interface SessionConfig {
  secret: string;
  name: string;
  resave: boolean;
  saveUninitialized: boolean;
  maxAge: number;
  absoluteTimeout: number;
  redis_url?: string;
  secure: boolean;
  httpOnly: boolean;
}

export interface PathsConfig {
  static: string;
  views: string;
}

export interface Config {
  DEPARTMENT_NAME: string | undefined;
  RATE_LIMIT_MAX: number;
  RATE_WINDOW_MS: number;
  SERVICE_NAME: string | undefined;
  SERVICE_PHASE: string | undefined;
  app: AppConfig;
  csrf: CsrfConfig;
  session: SessionConfig;
  paths: PathsConfig;
  auth: Auth;
}

export interface SassPluginOptions {
  resolveDir?: string;
  loadPaths?: string[];
  transform?: (source: string) => string;
}
