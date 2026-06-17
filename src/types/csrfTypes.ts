// This file contains type definitions for CSRF middleware in an Express application.
// Extended express-serve-static-core to include csrfToken in response.locals

export interface ExpertTypeOption {
  text: string;
  value: string;
}

declare module "express-serve-static-core" {
  // csrfToken is already defined in Request by csrf-sync

  // Add csrfToken to Response locals
  interface Locals {
    csrfToken?: string;
    expertTypes?: ExpertTypeOption[];
  }
}
