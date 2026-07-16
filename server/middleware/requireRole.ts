import { Request, Response, NextFunction } from "express"
import { hasRole, UserRole } from "../config/roles.js"

/**
 * Reusable role-gate middleware. Must run after `authenticate` (needs req.role).
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.role || !hasRole(req.role as UserRole, roles)) {
      res.status(403).json({ error: "Access denied." })
      return
    }
    next()
  }
}
