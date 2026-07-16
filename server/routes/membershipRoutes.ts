import { Router, Request, Response } from "express"
import { prisma, authenticate, snakeToCamel } from "../config/db.js"

const router = Router()

// GET /api/memberships — List membership plans
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const plans = await prisma.membership.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: { name: "asc" }
    })
    res.json(snakeToCamel(plans))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/memberships — Create plan (owner only)
router.post("/", authenticate, async (req: Request, res: Response) => {
  if (req.role !== "gym_owner") {
    res.status(403).json({ error: "Access denied. Owners only." }); return
  }
  try {
    const body = Array.isArray(req.body) ? req.body[0] : req.body
    const data = { ...snakeToCamel(body), tenantId: req.tenantId! }
    const item = await prisma.membership.create({ data })
    res.json(snakeToCamel(item))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/memberships — Update plan (owner only)
router.patch("/", authenticate, async (req: Request, res: Response) => {
  if (req.role !== "gym_owner") {
    res.status(403).json({ error: "Access denied. Owners only." }); return
  }
  try {
    const id = req.query.id as string
    if (!id) { res.status(400).json({ error: "ID required" }); return }
    const result = await prisma.membership.updateMany({
      where: { id, tenantId: req.tenantId! },
      data: snakeToCamel(req.body)
    })
    if (result.count === 0) { res.status(404).json({ error: "Item not found or access denied" }); return }
    const updated = await prisma.membership.findUnique({ where: { id } })
    res.json(snakeToCamel(updated))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/memberships — Remove plan (owner only)
router.delete("/", authenticate, async (req: Request, res: Response) => {
  if (req.role !== "gym_owner") {
    res.status(403).json({ error: "Access denied. Owners only." }); return
  }
  try {
    const id = req.query.id as string
    if (!id) { res.status(400).json({ error: "ID required" }); return }
    const result = await prisma.membership.deleteMany({
      where: { id, tenantId: req.tenantId! }
    })
    if (result.count === 0) { res.status(404).json({ error: "Item not found or access denied" }); return }
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
