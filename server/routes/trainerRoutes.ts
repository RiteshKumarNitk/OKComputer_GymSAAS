import { Router, Request, Response } from "express"
import { prisma, authenticate, snakeToCamel } from "../config/db.js"

const router = Router()

// GET /api/trainer/members — Trainer's member list (for mobile app)
router.get("/members", authenticate, async (req: Request, res: Response) => {
  try {
    const members = await prisma.member.findMany({
      where: { tenantId: req.tenantId! },
      include: { currentPlan: true }
    })

    const responseData = members.map((m: any) => ({
      id: m.id,
      name: m.fullName || m.full_name,
      planStatus: m.status || "inactive"
    }))

    res.json(responseData)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/trainer/workouts/daily-plan — Create daily workout plan for a member
router.post("/workouts/daily-plan", authenticate, async (req: Request, res: Response) => {
  const allowed = ["super_admin", "gym_owner", "manager", "trainer"]
  if (!allowed.includes(req.role!)) { res.status(403).json({ error: "Access denied" }); return }

  try {
    const { memberId, date, day, planType, exercises, status } = req.body
    const tenantId = req.tenantId!

    let trainerId: string | null = null
    if (req.role === "trainer") {
      const trainer = await prisma.trainer.findUnique({ where: { userId: req.userId!, tenantId } })
      if (trainer) trainerId = trainer.id
    }

    const planDate = date ? new Date(date) : new Date()
    planDate.setHours(0, 0, 0, 0)

    const plan = await prisma.dailyWorkoutPlan.create({
      data: {
        tenantId,
        trainerId,
        memberId,
        date: planDate,
        day: day || planDate.toLocaleDateString("en-US", { weekday: "long" }),
        planType: planType || "custom",
        exercises: exercises || [],
        status: status || "pending",
        progress: { totalExercises: exercises?.length || 0, completed: 0, percentage: 0 }
      }
    })

    res.json(snakeToCamel(plan))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
