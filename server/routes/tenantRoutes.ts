import { Router, Request, Response } from "express"
import bcrypt from "bcrypt"
import { prisma, authenticate, snakeToCamel } from "../config/db.js"

const router = Router()

// GET /api/tenants — List all tenants (public)
router.get("/", async (_req: Request, res: Response) => {
  const tenants = await prisma.tenant.findMany({
    include: { _count: { select: { members: true, users: true } } },
    orderBy: { createdAt: "desc" }
  })
  res.json(snakeToCamel(tenants))
})

// GET /api/tenants/:id — Get single tenant
router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    if (req.params.id !== req.tenantId && req.role !== "super_admin") {
      res.status(403).json({ error: "Access denied" }); return
    }
    const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } })
    if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return }
    res.json(snakeToCamel(tenant))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/tenants — Create tenant (public, includes auto-owner creation)
router.post("/", async (req: Request, res: Response) => {
  try {
    console.log("Creating tenant with body:", JSON.stringify(req.body, null, 2))
    const body = Array.isArray(req.body) ? req.body[0] : req.body
    const { ownerPassword, owner_password, ...rest } = body
    const password = ownerPassword || owner_password

    const converted = snakeToCamel(rest)
    console.log("Converted data for Prisma:", JSON.stringify(converted, null, 2))

    const data: any = {
      name: converted.name,
      slug: converted.slug,
      ownerName: converted.ownerName,
      ownerEmail: converted.ownerEmail,
      ownerPhone: converted.ownerPhone,
      ownerPhotoUrl: converted.ownerPhotoUrl,
      phone: converted.phone || converted.ownerPhone,
      email: converted.email || converted.ownerEmail,
      currency: converted.currency || converted.billingCurrency || "INR",
      logoUrl: converted.logoUrl,
      businessType: converted.businessType || "gym",
      gstNumber: converted.gstNumber,
      panNumber: converted.panNumber,
      registeredAddress: converted.registeredAddress,
      billingCycle: converted.billingCycle || "monthly",
      paymentGatewayPreference: converted.paymentGatewayPreference || "cash",
      invoicePrefix: converted.invoicePrefix || "GYM",
      primaryColor: converted.primaryColor,
      secondaryColor: converted.secondaryColor,
      subscriptionStatus: converted.subscriptionStatus || "active",
      subscriptionExpiresAt: converted.subscriptionExpiresAt ? new Date(converted.subscriptionExpiresAt) : null,
      status: converted.status || "active",
    }

    Object.keys(data).forEach(key => (data[key] === undefined || data[key] === null) && delete data[key])

    if (password && data.ownerEmail) {
      const result = await prisma.$transaction(async (tx: any) => {
        const tenant = await tx.tenant.create({ data })
        const hashed = await bcrypt.hash(password, 10)
        await tx.userProfile.create({
          data: { email: data.ownerEmail, passwordHash: hashed, fullName: data.ownerName || data.name, role: "gym_owner", tenantId: tenant.id }
        })
        return tenant
      })
      res.json(snakeToCamel(result)); return
    }

    const tenant = await prisma.tenant.create({ data })
    res.json(snakeToCamel(tenant))
  } catch (err: any) {
    console.error("CRITICAL: POST /api/tenants failure:", err.message)
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/tenants/:id — Update tenant
router.patch("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    if (req.params.id !== req.tenantId && req.role !== "super_admin") {
      res.status(403).json({ error: "Access denied" }); return
    }
    const data = snakeToCamel(req.body)
    const tenant = await prisma.tenant.update({ where: { id: req.params.id }, data })
    res.json(snakeToCamel(tenant))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/tenants — Update tenant by query param (alternative)
router.patch("/", async (req: Request, res: Response) => {
  const id = req.query.id as string
  if (!id) { res.status(400).json({ error: "ID required" }); return }
  const tenant = await prisma.tenant.update({ where: { id }, data: snakeToCamel(req.body) })
  res.json(snakeToCamel(tenant))
})

// DELETE /api/tenants — Delete tenant (super_admin only)
router.delete("/", authenticate, async (req: Request, res: Response) => {
  try {
    if (req.role !== "super_admin") {
      res.status(403).json({ error: "Only super_admin can delete tenants" }); return
    }
    const id = req.query.id as string
    if (!id) { res.status(400).json({ error: "ID required" }); return }
    const result = await prisma.tenant.deleteMany({ where: { id } })
    if (result.count === 0) { res.status(404).json({ error: "Tenant not found" }); return }
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
