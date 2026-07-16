import { Request, Response, NextFunction } from "express"
import { hasPermission } from "../config/roles.js"

/**
 * Permission-string gate — complements requireRole.ts's fixed-role-list gate
 * for routes where "which permission" is a more natural fit than "which
 * roles". Must run after `authenticate` (needs req.role). Passes if the
 * caller's role holds ANY of the listed permissions (or the "*" wildcard).
 */
export function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.role || !permissions.some((p) => hasPermission(req.role as any, p))) {
      res.status(403).json({ error: "Access denied." })
      return
    }
    next()
  }
}
