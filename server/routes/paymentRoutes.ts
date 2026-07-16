import { Router, Request, Response } from "express"
import crypto from "crypto"
import { prisma, authenticate, snakeToCamel } from "../config/db.js"
import { requireRole } from "../middleware/requireRole.js"

const router = Router()
// Money-handling routes — none of these had a role gate before this pass;
// same role set as the "Payments" sidebar nav item already uses.
const PAYMENT_ROLES = ["gym_owner", "manager", "frontdesk"] as const

// GET /api/payments — List payments
router.get("/", authenticate, requireRole(...PAYMENT_ROLES), async (req: Request, res: Response) => {
  try {
    const where: any = { tenantId: req.tenantId! }
    if (req.query.memberId) where.memberId = req.query.memberId as string
    if (req.query.status) where.status = req.query.status as string

    const payments = await prisma.payment.findMany({
      where,
      include: { member: { select: { fullName: true } } },
      orderBy: { paidAt: "desc" },
      take: req.query.limit ? parseInt(req.query.limit as string) : 20
    })
    res.json(snakeToCamel(payments))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/payments/settle — Full settlement (payment + invoice + member update)
router.post("/settle", authenticate, requireRole(...PAYMENT_ROLES), async (req: Request, res: Response) => {
  try {
    const { invoiceId, amount, method, notes, memberId } = snakeToCamel(req.body)
    const tenantId = req.tenantId!

    const result = await prisma.$transaction(async (tx: any) => {
      const payment = await tx.payment.create({
        data: { tenantId, memberId, invoiceId, amountCents: Math.round(parseFloat(amount) * 100), paymentMethod: method || "cash", status: "paid", paidAt: new Date(), notes }
      })

      if (invoiceId) {
        await tx.invoice.update({
          where: { id: invoiceId },
          data: { status: "paid", paidAt: new Date(), paymentId: payment.id }
        })
      } else {
        const invoiceNumber = `INV-${Date.now()}`
        await tx.invoice.create({
          data: { tenantId, memberId, paymentId: payment.id, invoiceNumber, subtotalPaise: payment.amountCents, totalPaise: payment.amountCents, status: "paid", paidAt: new Date(), lineItems: [{ description: "Membership Fee", amountPaise: payment.amountCents }] }
        })
      }

      const member = await tx.member.findUnique({ where: { id: memberId }, include: { currentPlan: true } })
      if (member && member.currentPlan) {
        const months = member.currentPlan.durationMonths || 1
        const currentExpiry = member.planExpiresAt && new Date(member.planExpiresAt) > new Date() ? new Date(member.planExpiresAt) : new Date()
        const newExpiry = new Date(currentExpiry)
        newExpiry.setMonth(newExpiry.getMonth() + months)
        await tx.member.update({ where: { id: memberId }, data: { status: "active", planExpiresAt: newExpiry, lastPaymentDate: new Date() } })
      }

      return payment
    })

    res.json(snakeToCamel(result))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/payments/razorpay-order — Create Razorpay order
router.post("/razorpay-order", authenticate, requireRole(...PAYMENT_ROLES), async (req: Request, res: Response) => {
  try {
    const { memberId, amountInr, membershipId } = req.body
    if (!memberId || !amountInr) { res.status(400).json({ error: "memberId and amountInr are required" }); return }

    const member = await prisma.member.findUnique({ where: { id: memberId, tenantId: req.tenantId! } })
    if (!member) { res.status(404).json({ error: "Member not found" }); return }

    const orderId = `order_${Math.random().toString(36).substr(2, 9)}`
    const amountPaise = Math.round(parseFloat(amountInr) * 100)

    const r_order = await prisma.razorpayOrder.create({
      data: { tenantId: req.tenantId!, razorpayOrderId: orderId, memberId, membershipId: membershipId || null, amountPaise, currency: "INR", receipt: `receipt_${Date.now()}`, status: "created" }
    })

    res.json({ success: true, orderId: r_order.razorpayOrderId, amount: r_order.amountPaise, currency: r_order.currency, keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_mock_key" })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/payments/razorpay-verify — Verify Razorpay payment signature
router.post("/razorpay-verify", authenticate, requireRole(...PAYMENT_ROLES), async (req: Request, res: Response) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      res.status(400).json({ error: "razorpayOrderId, razorpayPaymentId, and razorpaySignature are required" })
      return
    }

    // Validate signature using HMAC SHA256
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex")

    if (expectedSig !== razorpaySignature) {
      res.status(400).json({ error: "Invalid payment signature" })
      return
    }

    // Update order status
    const order = await prisma.razorpayOrder.update({
      where: { razorpayOrderId },
      data: { status: "paid" },
    })

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        tenantId: req.tenantId!,
        memberId: order.memberId,
        razorpayOrderId: order.razorpayOrderId,
        amountCents: order.amountPaise,
        currency: order.currency,
        provider: "razorpay",
        providerPaymentId: razorpayPaymentId,
        status: "paid",
        paidAt: new Date(),
      },
    })

    res.json({ success: true, paymentId: payment.id })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
