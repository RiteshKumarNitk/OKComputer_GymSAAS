import { Router, Request, Response } from "express"
import { prisma, authenticate, snakeToCamel } from "../config/db.js"
import { requirePermission } from "../middleware/requirePermission.js"

const router = Router()

// GET /api/access-controls — Get access controls for a role
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId! },
      select: { features: true }
    })
    const controls = (tenant?.features as any)?.accessControls || {}
    if (req.query.role) {
      res.json(controls[req.query.role as string] || []); return
    }
    res.json(controls)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/access-controls — Update access controls (requires manage_settings permission)
router.post("/", authenticate, requirePermission("manage_settings"), async (req: Request, res: Response) => {
  try {
    const { role, permissions } = req.body
    if (!role || !permissions) { res.status(400).json({ error: "Role and permissions required" }); return }

    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId! },
      select: { features: true }
    })
    const features = (tenant?.features as any) || {}
    const controls = features.accessControls || {}
    controls[role] = permissions
    features.accessControls = controls

    await prisma.tenant.update({ where: { id: req.tenantId! }, data: { features } })
    res.json({ success: true, role, permissions })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
