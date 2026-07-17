import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
  correlationId: string;
  getUserId: () => string | undefined;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export const getCorrelationId = (): string | undefined =>
  requestContext.getStore()?.correlationId;

export const getContextUserId = (): string | undefined =>
  requestContext.getStore()?.getUserId();
