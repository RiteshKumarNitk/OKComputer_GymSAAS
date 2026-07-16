import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from "express"
import { tenantScopeExtension } from "../lib/prismaTenantScope.js"
import { tenantContextStorage } from "../lib/tenantContext.js"

// Extend Express Request to include auth context
declare global {
  namespace Express {
    interface Request {
      userId?: string
      tenantId?: string
      role?: string
    }
  }
}

/** Request shape guaranteed after `authenticate` has run — no more `req: any`
 * needed in handlers that use this. `tenantId` stays nullable: super_admin
 * tokens carry no tenantId, so `string` alone would misrepresent that case
 * instead of forcing callers to handle it (as `crudHelper.ts`'s isSuperAdmin
 * branches already correctly do). */
export interface AuthenticatedRequest extends Request {
  userId: string
  tenantId: string | null
  role: string
}

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error("❌ CRITICAL: DATABASE_URL environment variable is not set!")
  process.exit(1)
}
if (!/sslmode=require|ssl=true/i.test(DATABASE_URL)) {
  console.warn("⚠️  DATABASE_URL does not appear to request SSL (sslmode=require). Connection may be unencrypted.")
}

const adapter = new PrismaPg({ connectionString: DATABASE_URL })
const basePrisma = new PrismaClient({ adapter })

/**
 * Extended client: auto-injects tenantId into the `where` clause of
 * queries against tenant-scoped models for the current request (see
 * lib/prismaTenantScope.ts). Exported under the same name as before so no
 * import path or call site anywhere else in the codebase needs to change —
 * `prisma.member.findMany(...)` etc. keep working exactly as written.
 */
export const prisma = basePrisma.$extends(tenantScopeExtension())

export const JWT_SECRET = process.env.NEXTAUTH_SECRET
if (!JWT_SECRET) {
  console.error("❌ CRITICAL: NEXTAUTH_SECRET environment variable is not set!")
  process.exit(1)
}

/**
 * Snake_case → camelCase converter for Supabase shim compatibility
 */
export function snakeToCamel(obj: any): any {
  if (Array.isArray(obj)) return obj.map(snakeToCamel)
  if (obj === null || typeof obj !== "object" || obj instanceof Date) return obj
  const result: any = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    result[camelKey] = (typeof value === "object" && value !== null && !(value instanceof Date))
      ? snakeToCamel(value) : value
  }
  return result
}

/**
 * Authentication middleware — verifies JWT and sets req.userId, req.tenantId, req.role
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    res.status(401).json({ error: "Authentication required" })
    return
  }

  try {
    const token = authHeader.replace("Bearer ", "")
    const decoded = jwt.verify(token, JWT_SECRET) as any
    req.userId = decoded.userId || decoded.id
    req.tenantId = decoded.tenantId
    req.role = decoded.role
    tenantContextStorage.run({ tenantId: req.tenantId ?? null, role: req.role ?? null }, next)
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" })
    return
  }
}
