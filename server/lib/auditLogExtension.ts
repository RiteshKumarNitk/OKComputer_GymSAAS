import { Prisma } from "@prisma/client"
import { getTenantContext } from "./tenantContext.js"
import { logAudit, sanitizeChanges, resolveAuditAction, extractResourceId } from "./auditLog.js"

/**
 * Models/operations that get an automatic AuditLog entry on every mutation,
 * mirroring lib/prismaTenantScope.ts's pattern (a Prisma client extension)
 * rather than hand-placed logAudit() calls at every route — see
 * FEATURE_COMPLETION_MATRIX.md #44 for why this shape was chosen.
 *
 * Covers "member changes", "payment changes", "role changes" (UserProfile
 * update, singled out by resolveAuditAction when `role` is in the payload),
 * and "tenant changes"/"settings changes" (Tenant is the same underlying
 * model for both — see server/routes/tenantRoutes.ts).
 *
 * Authentication events (login, OTP, impersonate) are NOT Prisma mutations
 * on these models, so they're logged via explicit logAudit() calls in
 * authRoutes.ts/authController.ts instead — that's intentional, not a gap.
 */
const AUDITED_OPERATIONS: Record<string, ReadonlySet<string>> = {
  Member: new Set(["create", "update", "updateMany", "delete", "deleteMany"]),
  Payment: new Set(["create", "update"]),
  UserProfile: new Set(["update"]),
  Tenant: new Set(["create", "update", "delete", "deleteMany"]),
}

export function auditLogExtension() {
  return Prisma.defineExtension({
    name: "auditLog",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const result = await query(args)

          const audited = model ? AUDITED_OPERATIONS[model] : undefined
          if (audited?.has(operation)) {
            const changes = sanitizeChanges((args as { data?: unknown })?.data)
            const ctx = getTenantContext()
            // Fire-and-forget: never let a logging failure surface as a
            // mutation failure, and never block the response on it.
            logAudit({
              tenantId: ctx?.tenantId ?? null,
              userId: ctx?.userId ?? null,
              action: resolveAuditAction(model as string, operation, changes),
              resourceType: model as string,
              resourceId: extractResourceId(args as { where?: { id?: unknown } }, result),
              changes,
            }).catch(() => {})
          }

          return result
        },
      },
    },
  })
}
