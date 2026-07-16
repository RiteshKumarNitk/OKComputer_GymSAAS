import { Router, Request, Response } from "express"
import { prisma, authenticate } from "../config/db.js"

const router = Router()

// GET /api/dashboard — Dashboard stats
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfDay = new Date(now.toISOString().split("T")[0])

    const [totalMembers, activeMembers, newMembersThisMonth, attendanceToday, revenue, monthlyRevenue] = await Promise.all([
      prisma.member.count({ where: { tenantId } }),
      prisma.member.count({ where: { tenantId, status: "active" } }),
      prisma.member.count({ where: { tenantId, createdAt: { gte: startOfMonth } } }),
      prisma.attendance.count({ where: { tenantId, checkinAt: { gte: startOfDay } } }),
      prisma.payment.aggregate({ where: { tenantId, status: "paid" }, _sum: { amountCents: true } }),
      prisma.payment.aggregate({ where: { tenantId, status: "paid", paidAt: { gte: startOfMonth } }, _sum: { amountCents: true } }),
    ])

    res.json({
      totalMembers, activeMembers, newMembersThisMonth, attendanceToday,
      totalRevenue: (revenue._sum.amountCents || 0) / 100,
      monthlyRevenue: (monthlyRevenue._sum.amountCents || 0) / 100,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
