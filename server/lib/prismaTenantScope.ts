import { Prisma } from "@prisma/client"
import { TENANT_SCOPED_MODELS } from "./tenantScopedModels.js"
import { getTenantContext, TenantContext } from "./tenantContext.js"

/** Operations whose `where` clause should get tenantId merged in. Deliberately
 * excludes create/createMany/upsert's create block — those already set
 * tenantId explicitly everywhere and are a different (write-side) concern. */
const SCOPED_OPERATIONS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findUnique",
  "findUniqueOrThrow",
  "findMany",
  "update",
  "updateMany",
  "upsert",
  "delete",
  "deleteMany",
  "count",
  "aggregate",
  "groupBy",
])

export interface ScopableArgs {
  where?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * Pure function: given a model/operation/args and the current tenant
 * context, returns args with tenantId merged into `where` when appropriate.
 * Exported standalone (not inlined into the $extends config) so it can be
 * unit-tested without a live Prisma client or database — see
 * server/__tests__/tenantScope.test.ts.
 */
export function applyTenantScope(
  model: string | undefined,
  operation: string,
  args: ScopableArgs | undefined,
  ctx: TenantContext | undefined
): ScopableArgs | undefined {
  if (!model || !ctx?.tenantId) return args
  if (ctx.role === "super_admin") return args
  if (!TENANT_SCOPED_MODELS.has(model)) return args
  if (!SCOPED_OPERATIONS.has(operation)) return args

  return {
    ...args,
    where: { ...(args?.where ?? {}), tenantId: ctx.tenantId },
  }
}

export function tenantScopeExtension() {
  return Prisma.defineExtension({
    name: "tenantScope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const scopedArgs = applyTenantScope(model, operation, args as ScopableArgs, getTenantContext())
          return query(scopedArgs as typeof args)
        },
      },
    },
  })
}
