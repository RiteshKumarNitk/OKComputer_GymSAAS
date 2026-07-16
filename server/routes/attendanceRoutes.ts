import { Router, Request, Response } from "express"
import { prisma, authenticate, snakeToCamel } from "../config/db.js"

const router = Router()

// GET /api/attendance — List attendance records
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const where: any = { tenantId: req.tenantId! }
    if (req.query.memberId) where.memberId = req.query.memberId as string
    if (req.query.date) {
      const d = new Date(req.query.date as string)
      where.checkinAt = {
        gte: new Date(d.setHours(0, 0, 0, 0)),
        lte: new Date(d.setHours(23, 59, 59, 999))
      }
    }

    const records = await prisma.attendance.findMany({
      where,
      include: { member: { select: { fullName: true, memberCode: true } } },
      orderBy: { checkinAt: "desc" },
    })
    res.json(snakeToCamel(records))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/attendance — Check-in (member or staff)
router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { memberId, staffId, userId, deviceInfo } = snakeToCamel(req.body)
    const tenantId = req.tenantId!
    const idToSearch = memberId || userId
    if (!idToSearch) { res.status(400).json({ error: "ID (Member or Staff) is required" }); return }

    // 1. Try to find a Member
    const member = await prisma.member.findFirst({
      where: { OR: [{ id: idToSearch }, { userId: idToSearch }], tenantId },
      include: { currentPlan: true }
    })

    if (member) {
      const expiryDate = member.planExpiresAt
      if (expiryDate && new Date(expiryDate) < new Date()) {
        await prisma.member.update({ where: { id: member.id }, data: { status: "expired" } })
        res.status(400).json({ error: "Membership has expired. Please renew." }); return
      }
      if (member.status !== "active") { res.status(400).json({ error: `Member status is ${member.status}` }); return }

      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const existing = await prisma.attendance.findFirst({
        where: { memberId: member.id, tenantId, checkinAt: { gte: todayStart } }
      })
      if (existing) { res.status(400).json({ error: "Member already checked in today" }); return }

      const attendance = await prisma.attendance.create({
        data: { tenantId, memberId: member.id, checkinAt: new Date(), deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null }
      })

      await prisma.memberFitnessStats.upsert({
        where: { memberId: member.id },
        update: { totalCheckIns: { increment: 1 } },
        create: { memberId: member.id, tenantId, totalCheckIns: 1 }
      })

      res.json(snakeToCamel(attendance)); return
    }

    // 2. Try to find a Staff Profile
    const staff = await prisma.staffProfile.findFirst({
      where: { OR: [{ id: idToSearch }, { userId: idToSearch }], tenantId }
    })

    if (staff) {
      const date = new Date()
      date.setHours(0, 0, 0, 0)

      const staffAttendance = await prisma.staffAttendance.upsert({
        where: { staffId_date: { staffId: staff.id, date } },
        update: { checkOutAt: new Date() },
        create: { tenantId, staffId: staff.id, date, checkInAt: new Date(), isPresent: true }
      })

      res.json(snakeToCamel(staffAttendance)); return
    }

    res.status(404).json({ error: "No member or staff profile found for this code" })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/attendance — Checkout
router.patch("/", authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.query.id as string
    if (!id) { res.status(400).json({ error: "ID required" }); return }

    const result = await prisma.attendance.updateMany({
      where: { id, tenantId: req.tenantId! },
      data: { checkoutAt: new Date() }
    })

    if (result.count === 0) {
      res.status(404).json({ error: "Attendance record not found or access denied" }); return
    }
    const updated = await prisma.attendance.findUnique({ where: { id } })
    res.json(snakeToCamel(updated))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
