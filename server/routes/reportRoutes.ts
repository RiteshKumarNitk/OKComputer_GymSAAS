import { Router, Request, Response } from "express"
import { prisma, authenticate, snakeToCamel } from "../config/db.js"

const router = Router()

// GET /api/reports/dashboard — Full dashboard stats
router.get("/dashboard", authenticate, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req
    if (!tenantId) { res.status(400).json({ error: "Tenant ID required" }); return }

    const { startDate, endDate } = req.query
    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const end = endDate ? new Date(endDate as string) : new Date()
    const todayStr = new Date().toISOString().split("T")[0]

    const [totalMembers, activeMembers, totalTrainers, totalFrontdesk, totalManagers, activeLeaves] = await Promise.all([
      prisma.member.count({ where: { tenantId } }),
      prisma.member.count({ where: { tenantId, status: "active" } }),
      prisma.userProfile.count({ where: { tenantId, role: "trainer" } }),
      prisma.userProfile.count({ where: { tenantId, role: "frontdesk" } }),
      prisma.userProfile.count({ where: { tenantId, role: "frontdesk" } }),
      prisma.staffLeave.count({
        where: { tenantId, status: "approved", startDate: { lte: new Date() }, endDate: { gte: new Date() } }
      })
    ])

    const payments = await prisma.payment.findMany({
      where: { tenantId, status: "paid" },
      select: { amountCents: true, paidAt: true, createdAt: true }
    })

    const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.amountCents || 0), 0)
    const monthlyRevenue = payments
      .filter((p: any) => {
        const date = p.paidAt || p.createdAt
        return date && new Date(date) >= start && new Date(date) <= end
      })
      .reduce((sum: number, p: any) => sum + (p.amountCents || 0), 0)

    const attendanceToday = await prisma.attendance.count({
      where: { tenantId, checkinAt: { gte: new Date(`${todayStr}T00:00:00.000Z`), lt: new Date(`${todayStr}T23:59:59.999Z`) } }
    })

    const [totalLeads, hotLeads, pendingFollowUps, totalFollowUpsToday] = await Promise.all([
      prisma.lead.count({ where: { tenantId } }),
      prisma.lead.count({ where: { tenantId, priority: "hot" } }),
      prisma.followUp.count({ where: { tenantId, status: "pending" } }),
      prisma.followUp.count({
        where: { tenantId, followUpDate: { gte: new Date(`${todayStr}T00:00:00.000Z`), lt: new Date(`${todayStr}T23:59:59.999Z`) } }
      })
    ])

    const newMembersThisMonth = await prisma.member.count({
      where: { tenantId, createdAt: { gte: start, lte: end } }
    })

    res.json({
      totalMembers, activeMembers, totalTrainers, totalFrontdesk, totalManagers, activeLeaves,
      totalRevenue, monthlyRevenue, attendanceToday, newMembersThisMonth,
      totalLeads, hotLeads, pendingFollowUps, totalFollowUpsToday
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reports — Report data by type
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!
    const type = req.query.type as string

    if (type === "revenue") {
      const payments = await prisma.payment.findMany({
        where: { tenantId, status: "paid" },
        select: { amountCents: true, paidAt: true },
        orderBy: { paidAt: "asc" }
      })
      res.json(snakeToCamel(payments)); return
    }
    if (type === "attendance") {
      const records = await prisma.attendance.findMany({
        where: { tenantId },
        select: { checkinAt: true },
        orderBy: { checkinAt: "asc" }
      })
      res.json(snakeToCamel(records)); return
    }
    if (type === "member-growth") {
      const members = await prisma.member.findMany({
        where: { tenantId },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" }
      })
      res.json(snakeToCamel(members)); return
    }
    res.status(400).json({ error: "type parameter required" })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reports/members — Member-specific reports (expiring, new, inactive)
router.get("/members", authenticate, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req
    if (!tenantId) { res.status(400).json({ error: "Tenant ID required" }); return }

    const today = new Date()
    const next30Days = new Date(); next30Days.setDate(today.getDate() + 30)
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [expiring, newJoiners, allActive] = await Promise.all([
      prisma.member.findMany({
        where: { tenantId, status: "active", planExpiresAt: { gte: today, lte: next30Days } },
        include: { currentPlan: true },
        orderBy: { planExpiresAt: "asc" }
      }),
      prisma.member.findMany({
        where: { tenantId, joinedAt: { gte: thirtyDaysAgo } },
        include: { currentPlan: true },
        orderBy: { joinedAt: "desc" }
      }),
      prisma.member.findMany({
        where: { tenantId, status: "active" },
        select: { id: true, fullName: true, memberCode: true, phone: true, createdAt: true }
      })
    ])

    const recentAttendance = await prisma.attendance.findMany({
      where: { tenantId, checkinAt: { gte: sevenDaysAgo } },
      select: { memberId: true }
    })
    const activeMemberIdsInAttendance = new Set(recentAttendance.map(a => a.memberId))
    const inactive = allActive.filter(m => !activeMemberIdsInAttendance.has(m.id))

    res.json({ expiring: snakeToCamel(expiring), newJoiners: snakeToCamel(newJoiners), inactive: snakeToCamel(inactive) })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reports/capacity — Current gym capacity report
router.get("/capacity", authenticate, async (req: Request, res: Response) => {
  try {
    const currentCount = await prisma.attendance.count({
      where: { tenantId: req.tenantId!, checkoutAt: null }
    })

    const maxCapacity = 100
    res.json({ currentCount, maxCapacity, percentFull: (currentCount / maxCapacity) * 100 })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reports/activity — Recent activity feed
router.get("/activity", authenticate, async (req: Request, res: Response) => {
  try {
    const activity = await prisma.attendance.findMany({
      where: { tenantId: req.tenantId! },
      include: { member: { select: { fullName: true, memberCode: true, avatarUrl: true } } },
      orderBy: { checkinAt: "desc" },
      take: 20
    })
    res.json(snakeToCamel(activity))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
