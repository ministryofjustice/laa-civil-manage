import type { PriorAuthority } from "#src/types/priorAuthority/shared.ts";

export {};

declare global {
  namespace Express {
    interface Locals {
      cspNonce: string;
    }
    interface Request {
      priorAuthority?: PriorAuthority;
    }
  }
}
