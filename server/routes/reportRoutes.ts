import { Router, Request, Response } from "express"
import { z } from "zod"
import { prisma, authenticate, snakeToCamel } from "../config/db.js"
import {
  lastNMonthKeys,
  lastNWeekKeys,
  bucketMonthlySum,
  bucketMonthlyCount,
  bucketWeeklyCount,
  computeRetention,
  computeTopPlans,
} from "../lib/analytics.js"

const router = Router()

const trendQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).optional().default(12),
  weeks: z.coerce.number().int().min(1).max(52).optional().default(12),
})

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

    const [totalLeads, hotLeads, warmLeads, coldLeads, pendingFollowUps, totalFollowUpsToday] = await Promise.all([
      prisma.lead.count({ where: { tenantId } }),
      prisma.lead.count({ where: { tenantId, priority: "hot" } }),
      prisma.lead.count({ where: { tenantId, priority: "warm" } }),
      prisma.lead.count({ where: { tenantId, priority: "cold" } }),
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
      totalLeads, hotLeads, warmLeads, coldLeads, pendingFollowUps, totalFollowUpsToday
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reports — Real, backend-aggregated report data by type.
// All trend endpoints are bucketed and bounded (max 24 months / 52 weeks) —
// they replace an earlier version of this route that returned every
// matching row unbounded and unaggregated (see DATABASE_REVIEW.md D5), and
// were never actually consumed by the frontend, which instead extrapolated
// fake trend data client-side from a single total. This is the real
// replacement for that.
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    if (!["gym_owner", "manager", "super_admin"].includes(req.role || "")) {
      res.status(403).json({ error: "Access denied." }); return
    }
    const tenantId = req.tenantId!
    const type = req.query.type as string
    const parsedQuery = trendQuerySchema.safeParse(req.query)
    if (!parsedQuery.success) {
      res.status(400).json({ error: "Invalid query parameters", details: parsedQuery.error.flatten() }); return
    }
    const { months, weeks } = parsedQuery.data

    if (type === "revenue") {
      const since = new Date(`${lastNMonthKeys(months)[0]}-01`)
      const [payments, expenses] = await Promise.all([
        prisma.payment.findMany({
          where: { tenantId, status: "paid", paidAt: { gte: since } },
          select: { amountCents: true, paidAt: true }
        }),
        prisma.expense.findMany({
          where: { tenantId, expenseDate: { gte: since } },
          select: { amountCents: true, expenseDate: true }
        })
      ])
      const revenueBuckets = bucketMonthlySum(payments.map(p => ({ date: p.paidAt, value: (p.amountCents || 0) / 100 })), months)
      const expenseBuckets = bucketMonthlySum(expenses.map(e => ({ date: e.expenseDate, value: (e.amountCents || 0) / 100 })), months)
      const combined = revenueBuckets.map((r, i) => ({
        month: r.month,
        label: r.label,
        revenue: r.value,
        expenses: expenseBuckets[i]?.value || 0,
        profit: r.value - (expenseBuckets[i]?.value || 0),
      }))
      res.json(combined); return
    }

    if (type === "attendance") {
      const since = new Date(`${lastNWeekKeys(weeks)[0]}T00:00:00.000Z`)
      const records = await prisma.attendance.findMany({
        where: { tenantId, checkinAt: { gte: since } },
        select: { checkinAt: true }
      })
      res.json(bucketWeeklyCount(records.map(r => ({ date: r.checkinAt })), weeks)); return
    }

    if (type === "member-growth") {
      const since = new Date(`${lastNMonthKeys(months)[0]}-01`)
      const members = await prisma.member.findMany({
        where: { tenantId, joinedAt: { gte: since } },
        select: { joinedAt: true }
      })
      res.json(bucketMonthlyCount(members.map(m => ({ date: m.joinedAt })), months)); return
    }

    if (type === "lead-growth") {
      const since = new Date(`${lastNMonthKeys(months)[0]}-01`)
      const leads = await prisma.lead.findMany({
        where: { tenantId, createdAt: { gte: since } },
        select: { createdAt: true }
      })
      res.json(bucketMonthlyCount(leads.map(l => ({ date: l.createdAt })), months)); return
    }

    if (type === "retention") {
      const now = new Date()
      const cutoff30 = new Date(now); cutoff30.setDate(cutoff30.getDate() - 30)
      const cutoff90 = new Date(now); cutoff90.setDate(cutoff90.getDate() - 90)
      const [cohort30, cohort90] = await Promise.all([
        prisma.member.findMany({ where: { tenantId, joinedAt: { lte: cutoff30 } }, select: { status: true } }),
        prisma.member.findMany({ where: { tenantId, joinedAt: { lte: cutoff90 } }, select: { status: true } }),
      ])
      res.json(computeRetention(cohort30, cohort90)); return
    }

    if (type === "top-plans") {
      const since = new Date(`${lastNMonthKeys(months)[0]}-01`)
      const payments = await prisma.payment.findMany({
        where: { tenantId, status: "paid", paidAt: { gte: since }, membershipId: { not: null } },
        select: { membershipId: true, amountCents: true, memberId: true, membership: { select: { name: true } } }
      })
      const topPlans = computeTopPlans(payments.map(p => ({
        membershipId: p.membershipId,
        planName: p.membership?.name || "Unknown Plan",
        amountCents: p.amountCents,
        memberId: p.memberId,
      })))
      res.json(topPlans); return
    }

    res.status(400).json({ error: "type parameter required" })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reports/platform-growth — Super-admin-only, real platform-wide
// trends. Deliberately cross-tenant (that's the point at this level) —
// exempt from tenant scoping the same way every other super_admin-only
// query in this codebase is.
router.get("/platform-growth", authenticate, async (req: Request, res: Response) => {
  try {
    if (req.role !== "super_admin") {
      res.status(403).json({ error: "Access denied." }); return
    }
    const parsedQuery = trendQuerySchema.safeParse(req.query)
    if (!parsedQuery.success) {
      res.status(400).json({ error: "Invalid query parameters", details: parsedQuery.error.flatten() }); return
    }
    const { months } = parsedQuery.data
    const since = new Date(`${lastNMonthKeys(months)[0]}-01`)
    const startOfToday = new Date(new Date().toISOString().split("T")[0])

    const [tenants, invoices, members, todayCheckins] = await Promise.all([
      prisma.tenant.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.saasInvoice.findMany({ where: { status: "paid", createdAt: { gte: since } }, select: { amountPaise: true, createdAt: true } }),
      prisma.member.findMany({ where: { joinedAt: { gte: since } }, select: { joinedAt: true } }),
      prisma.attendance.count({ where: { checkinAt: { gte: startOfToday } } }),
    ])

    res.json({
      tenantGrowth: bucketMonthlyCount(tenants.map(t => ({ date: t.createdAt })), months),
      revenueGrowth: bucketMonthlySum(invoices.map(i => ({ date: i.createdAt, value: (i.amountPaise || 0) / 100 })), months),
      memberGrowth: bucketMonthlyCount(members.map(m => ({ date: m.joinedAt })), months),
      todayCheckins,
    })
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
