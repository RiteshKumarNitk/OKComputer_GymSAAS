import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from "express"

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

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
export const prisma = new PrismaClient({ adapter })

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
    next()
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" })
    return
  }
}
