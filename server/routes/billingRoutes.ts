import { Router, Request, Response } from "express"
import { prisma, authenticate } from "../config/db.js"

const router = Router()

// GET /api/billing — SaaS billing info
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const type = req.query.type as string
    const tenantId = req.query.tenantId as string

    if (type === "plans") {
      const plans = await prisma.saasPlan.findMany({ where: { isActive: true }, orderBy: { pricePaise: "asc" } })
      res.json(plans); return
    }

    if ((type === "subscription" || type === "invoices") && tenantId) {
      if (tenantId !== req.tenantId && req.role !== "super_admin") {
        res.status(403).json({ error: "Access denied" }); return
      }
    }

    if (type === "subscription" && tenantId) {
      const sub = await prisma.saasSubscription.findFirst({
        where: { tenantId }, include: { plan: true }, orderBy: { createdAt: "desc" }
      })
      res.json(sub); return
    }
    if (type === "invoices" && tenantId) {
      const invoices = await prisma.saasInvoice.findMany({
        where: { tenantId }, orderBy: { createdAt: "desc" }
      })
      res.json(invoices); return
    }
    res.status(400).json({ error: "type parameter required" })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
