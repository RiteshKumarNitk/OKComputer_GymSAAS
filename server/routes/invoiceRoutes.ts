import { Router, Request, Response } from "express"
import { prisma, authenticate, snakeToCamel } from "../config/db.js"

const router = Router()

// GET /api/invoices — List invoices
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const where: any = { tenantId: req.tenantId! }
    if (req.query.memberId) where.memberId = req.query.memberId as string
    if (req.query.status) where.status = req.query.status as string

    const invoices = await prisma.invoice.findMany({
      where,
      include: { member: { select: { fullName: true, memberCode: true } } },
      orderBy: { invoiceDate: "desc" }
    })
    res.json(snakeToCamel(invoices))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/invoices/:id — Get single invoice
router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id, tenantId: req.tenantId! },
      include: { member: true, tenant: true }
    })
    if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return }
    res.json(snakeToCamel(invoice))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
