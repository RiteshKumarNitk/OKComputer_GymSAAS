import logger from "../config/logger.js"

// prisma is imported lazily inside logAudit() (not at module top-level) —
// db.ts assembles the extended client using auditLogExtension.ts, which
// imports this file, which would otherwise create a circular static import
// (db.ts -> auditLogExtension.ts -> auditLog.ts -> db.ts). A dynamic
// import() resolves at call time, well after both modules finish loading,
// so it sidesteps the cycle instead of fighting Node's live-binding
// semantics for it.
async function getPrisma() {
  const { prisma } = await import("../config/db.js")
  return prisma
}

/**
 * Fields that must never be written into an AuditLog row's `changes` JSON,
 * even though they may be present in the mutation payload being logged.
 */
const SENSITIVE_FIELDS = new Set(["passwordHash", "qrToken", "qrTokenExpiresAt"])

/** Strips sensitive fields from a mutation's `data` payload before logging it. */
export function sanitizeChanges(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_FIELDS.has(key)) continue
    result[key] = value
  }
  return result
}

/**
 * Names the audit action for a given model/operation. UserProfile updates
 * that touch `role` are called out specifically as "role_changed" rather
 * than a generic "update" — role changes are the one UserProfile mutation
 * this system is specifically asked to distinguish.
 */
export function resolveAuditAction(model: string, operation: string, changes?: Record<string, unknown> | null): string {
  const op = operation.endsWith("Many") ? operation.slice(0, -4) : operation
  if (model === "UserProfile" && op === "update" && changes && "role" in changes) {
    return "role_changed"
  }
  return `${model.toLowerCase()}_${op}`
}

/** Best-effort resourceId extraction: prefer the mutation's own result id, fall back to the where clause. */
export function extractResourceId(args: { where?: { id?: unknown } } | undefined, result: unknown): string | null {
  if (result && typeof result === "object" && "id" in (result as Record<string, unknown>)) {
    const id = (result as Record<string, unknown>).id
    if (typeof id === "string") return id
  }
  if (args?.where?.id && typeof args.where.id === "string") return args.where.id
  return null
}

export interface AuditEntryInput {
  tenantId?: string | null
  userId?: string | null
  action: string
  resourceType: string
  resourceId?: string | null
  changes?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
}

/**
 * Writes an AuditLog row. Fire-and-forget by design — a logging failure
 * (e.g. a transient DB blip) must never break the business operation it's
 * describing. Callers should not await this in a way that blocks the
 * response; `.catch(() => {})` at the call site if awaiting at all.
 */
export async function logAudit(entry: AuditEntryInput): Promise<void> {
  try {
    const prisma = await getPrisma()
    await prisma.auditLog.create({
      data: {
        tenantId: entry.tenantId ?? null,
        userId: entry.userId ?? null,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId ?? null,
        changes: entry.changes ? (entry.changes as any) : undefined,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
      },
    })
  } catch (err: any) {
    logger.error("Audit log write failed:", err.message)
  }
}

interface RequestLike {
  tenantId?: string
  userId?: string
  ip?: string
  headers?: { [key: string]: string | string[] | undefined }
}

/** Convenience wrapper for route handlers — pulls tenantId/userId/IP/UA off req. */
export function logAuditFromRequest(
  req: RequestLike,
  entry: Omit<AuditEntryInput, "tenantId" | "userId" | "ipAddress" | "userAgent">
): Promise<void> {
  const userAgent = req.headers?.["user-agent"]
  return logAudit({
    ...entry,
    tenantId: req.tenantId ?? null,
    userId: req.userId ?? null,
    ipAddress: req.ip ?? null,
    userAgent: typeof userAgent === "string" ? userAgent : null,
  })
}
