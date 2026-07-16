import { Router, Request, Response } from "express"
import { prisma, authenticate, snakeToCamel } from "../config/db.js"
import { requireRole } from "../middleware/requireRole.js"

const router = Router()

// GET /api/staff/me/stats — Staff's own stats + attendance
router.get("/me/stats", authenticate, async (req: Request, res: Response) => {
  try {
    const staff = await prisma.staffProfile.findUnique({ where: { userId: req.userId } })
    if (!staff) { res.status(404).json({ error: "Staff profile not found" }); return }

    const attendance = await prisma.staffAttendance.findMany({
      where: { staffId: staff.id },
      orderBy: { date: "desc" },
      take: 30
    })

    res.json({ staffInfo: snakeToCamel(staff), attendanceTrend: snakeToCamel(attendance) })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/staff/profiles — List staff profiles
router.get("/profiles", authenticate, async (req: Request, res: Response) => {
  try {
    const staff = await prisma.staffProfile.findMany({
      where: { tenantId: req.tenantId! },
      include: { user: { select: { fullName: true, role: true, email: true, phone: true } } }
    })
    res.json(snakeToCamel(staff))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/staff/profiles — Create staff profile
router.post("/profiles", authenticate, requireRole("gym_owner", "manager"), async (req: Request, res: Response) => {
  try {
    const data = snakeToCamel(req.body)
    const staff = await prisma.staffProfile.create({
      data: { ...data, tenantId: req.tenantId!, joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date() }
    })
    res.json(snakeToCamel(staff))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/staff/profiles/:id — Update staff profile
router.patch("/profiles/:id", authenticate, requireRole("gym_owner", "manager"), async (req: Request, res: Response) => {
  try {
    const data = snakeToCamel(req.body)
    if (data.joiningDate) data.joiningDate = new Date(data.joiningDate)
    if (data.resignationDate) data.resignationDate = new Date(data.resignationDate)

    const staff = await prisma.staffProfile.update({
      where: { id: req.params.id, tenantId: req.tenantId! },
      data
    })
    res.json(snakeToCamel(staff))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/staff/leaves — List leave requests
router.get("/leaves", authenticate, async (req: Request, res: Response) => {
  try {
    const leaves = await prisma.staffLeave.findMany({
      where: { tenantId: req.tenantId! },
      include: { staff: { include: { user: { select: { fullName: true } } } } },
      orderBy: { createdAt: "desc" }
    })
    res.json(snakeToCamel(leaves))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/staff/leaves — Create leave request
router.post("/leaves", authenticate, async (req: Request, res: Response) => {
  try {
    const data = snakeToCamel(req.body)
    const leave = await prisma.staffLeave.create({
      data: { ...data, tenantId: req.tenantId!, startDate: new Date(data.startDate), endDate: new Date(data.endDate), status: "pending" }
    })
    res.json(snakeToCamel(leave))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/staff/leaves/:id — Approve/reject leave
router.patch("/leaves/:id", authenticate, requireRole("gym_owner", "manager"), async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body
    const leave = await prisma.staffLeave.update({
      where: { id: req.params.id, tenantId: req.tenantId! },
      data: { status, notes, approvedBy: req.userId, approvedAt: status === "approved" ? new Date() : null }
    })
    res.json(snakeToCamel(leave))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
