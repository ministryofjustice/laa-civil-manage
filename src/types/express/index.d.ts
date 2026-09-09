import type { PriorAuthority } from "#src/types/priorAuthority/shared.ts";

export {};

declare global {
  namespace Express {
    interface Locals {
      cspNonce: string;
    }
    interface Request {
      // Loose view-model hydrated from the backend draft for the current request, by loadPriorAuthority.
      priorAuthority?: PriorAuthority;
    }
  }
}
