import { AsyncLocalStorage } from "node:async_hooks"

export interface TenantContext {
  tenantId: string | null
  role: string | null
  userId: string | null
}

/**
 * Carries the current request's tenantId/role through the async call chain
 * (route handlers, awaited service calls, Prisma queries) without needing to
 * thread it through every function signature. Established once per request
 * by the `authenticate` middleware in config/db.ts. Background jobs
 * (setInterval-based cron in index.ts) never run inside a `.run()` call, so
 * getTenantContext() correctly returns undefined for them.
 */
export const tenantContextStorage = new AsyncLocalStorage<TenantContext>()

export function getTenantContext(): TenantContext | undefined {
  return tenantContextStorage.getStore()
}
