import { Router, Request, Response } from "express"
import { prisma, authenticate, snakeToCamel } from "../config/db.js"
import { requireRole } from "../middleware/requireRole.js"

const router = Router()

// POST /api/members — override to auto-generate Invoices and Payments
router.post("/", authenticate, requireRole("gym_owner", "manager", "frontdesk"), async (req: Request, res: Response) => {
  try {
    const data = snakeToCamel(req.body)
    const tenantId = req.tenantId!

    const result = await prisma.$transaction(async (tx) => {
      const member = await (tx as any).member.create({
        data: {
          ...data,
          tenantId,
          joinedAt: data.joinedAt ? new Date(data.joinedAt) : new Date(),
          dob: data.dob ? new Date(data.dob) : null,
          planStartedAt: data.planStartedAt ? new Date(data.planStartedAt) : null,
          planExpiresAt: data.planExpiresAt ? new Date(data.planExpiresAt) : null,
        }
      })

      if (data.currentPlanId) {
        const plan = await (tx as any).membership.findFirst({ where: { id: data.currentPlanId, tenantId } })
        if (plan) {
          const subtotalPaise = plan.priceCents
          const taxPercent = 0
          const taxPaise = Math.round(subtotalPaise * (taxPercent / 100))

          const payment = await (tx as any).payment.create({
            data: {
              tenantId,
              memberId: member.id,
              membershipId: plan.id,
              amountCents: subtotalPaise,
              currency: plan.currency || "INR",
              provider: "cash",
              status: "paid",
              paidAt: new Date(),
            }
          })

          const invoiceNumber = `INV-${tenantId.slice(0, 4).toUpperCase()}-${Date.now()}`
          await (tx as any).invoice.create({
            data: {
              tenantId,
              memberId: member.id,
              paymentId: payment.id,
              invoiceNumber,
              subtotalPaise,
              taxPercent,
              taxPaise,
              totalPaise: subtotalPaise,
              status: "paid",
              lineItems: [{ name: plan.name, priceCents: plan.priceCents, quantity: 1 }],
            }
          })
        }
      }
      return member
    })

    res.json(snakeToCamel(result))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/members/renew — Renew member plan + auto-generate Invoice & Payment
router.post("/renew", authenticate, requireRole("gym_owner", "manager", "frontdesk"), async (req: Request, res: Response) => {
  try {
    const { id, planId } = snakeToCamel(req.body)
    const tenantId = req.tenantId!

    if (!id) { res.status(400).json({ error: "Member ID is required" }); return }

    const member = await prisma.member.findUnique({ where: { id, tenantId } })
    if (!member) { res.status(404).json({ error: "Member not found" }); return }

    const selectedPlanId = planId || member.currentPlanId
    if (!selectedPlanId) { res.status(400).json({ error: "Plan ID is required for renewal" }); return }

    const plan = await prisma.membership.findFirst({ where: { id: selectedPlanId, tenantId } })
    if (!plan) { res.status(404).json({ error: "Plan not found" }); return }

    const result = await prisma.$transaction(async (tx) => {
      const startDate = new Date()
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + (plan.durationDays || 30))

      const updatedMember = await (tx as any).member.update({
        where: { id },
        data: { currentPlanId: plan.id, planStartedAt: startDate, planExpiresAt: endDate, status: "active" }
      })

      const subtotalPaise = plan.priceCents
      const payment = await (tx as any).payment.create({
        data: { tenantId, memberId: member.id, membershipId: plan.id, amountCents: subtotalPaise, currency: plan.currency || "INR", provider: "cash", status: "paid", paidAt: new Date() }
      })

      const invoiceNumber = `INV-${tenantId.slice(0, 4).toUpperCase()}-${Date.now()}`
      await (tx as any).invoice.create({
        data: { tenantId, memberId: member.id, paymentId: payment.id, invoiceNumber, subtotalPaise, taxPercent: 0, taxPaise: 0, totalPaise: subtotalPaise, status: "paid", lineItems: [{ name: `Renewal - ${plan.name}`, priceCents: plan.priceCents, quantity: 1 }] }
      })

      return updatedMember
    })

    res.json(snakeToCamel(result))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/members/leaderboard — Member leaderboard by check-in points
router.get("/leaderboard", authenticate, async (req: Request, res: Response) => {
  try {
    const leaderboard = await prisma.memberFitnessStats.findMany({
      where: { tenantId: req.tenantId! },
      include: { member: { select: { id: true, fullName: true, avatarUrl: true } } },
      orderBy: [{ totalCheckIns: "desc" }, { currentStreak: "desc" }],
      take: 20
    })

    const formatted = leaderboard.map((s: any, index: number) => ({
      id: s.member.id,
      name: s.member.fullName,
      avatarUrl: s.member.avatarUrl,
      points: s.totalCheckIns * 10,
      rank: index + 1
    }))

    res.json(formatted)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/members/me/stats — Member's own fitness stats
router.get("/me/stats", authenticate, async (req: Request, res: Response) => {
  try {
    const member = await prisma.member.findUnique({ where: { userId: req.userId } })
    if (!member) { res.status(404).json({ error: "Member profile not found" }); return }

    const stats = await prisma.memberFitnessStats.findUnique({ where: { memberId: member.id } })

    const attendance = await prisma.attendance.findMany({
      where: { memberId: member.id },
      take: 7,
      orderBy: { checkinAt: "desc" }
    })

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const intensityTrend = attendance.reverse().map((a: any, i: number) => ({
      day: days[new Date(a.checkinAt).getDay()],
      minutes: 65 + Math.floor(Math.random() * 20)
    }))

    res.json({
      totalWorkouts: stats?.totalWorkoutsCompleted || 0,
      activeDays: stats?.totalCheckIns || 0,
      loyaltyPoints: (stats?.totalCheckIns || 0) * 10,
      currentStreak: stats?.currentStreak || 0,
      intensityTrend
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/members/me/bookings — Member's trainer slot bookings
router.get("/me/bookings", authenticate, async (req: Request, res: Response) => {
  try {
    const member = await prisma.member.findUnique({ where: { userId: req.userId } })
    if (!member) { res.status(404).json({ error: "Member profile not found" }); return }

    const bookings = await prisma.trainerSlot.findMany({
      where: { bookedByMemberId: member.id, tenantId: req.tenantId! },
      include: { trainer: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" }
    })

    res.json(snakeToCamel(bookings))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/members/me/workouts — Member's pending workouts
router.get("/me/workouts", authenticate, async (req: Request, res: Response) => {
  try {
    const member = await prisma.member.findUnique({ where: { userId: req.userId } })
    if (!member) { res.status(404).json({ error: "Member not found" }); return }

    const workouts = await prisma.memberWorkout.findMany({
      where: { memberId: member.id, tenantId: req.tenantId!, completedAt: null },
      include: { workout: true },
      orderBy: { assignedAt: "desc" }
    })

    res.json(snakeToCamel(workouts))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/members/me/workouts/:id — Mark workout complete
router.patch("/me/workouts/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const member = await prisma.member.findUnique({ where: { userId: req.userId } })
    if (!member) { res.status(404).json({ error: "Member not found" }); return }

    const { completed, notes, progress } = req.body

    const result = await prisma.memberWorkout.updateMany({
      where: { id: req.params.id, memberId: member.id, tenantId: req.tenantId! },
      data: { completedAt: completed ? new Date() : undefined, notes, progress: progress || undefined }
    })

    if (result.count === 0) { res.status(404).json({ error: "Workout assignment not found" }); return }

    if (completed) {
      await prisma.memberFitnessStats.upsert({
        where: { memberId: member.id },
        update: { totalWorkoutsCompleted: { increment: 1 } },
        create: { memberId: member.id, tenantId: req.tenantId!, totalWorkoutsCompleted: 1 }
      })
    }

    const updated = await prisma.memberWorkout.findUnique({ where: { id: req.params.id } })
    res.json(snakeToCamel(updated))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/members/me/measurements — Log body measurement
router.post("/me/measurements", authenticate, async (req: Request, res: Response) => {
  try {
    const member = await prisma.member.findUnique({
      where: { userId: req.userId },
      include: { healthProfile: true }
    })
    if (!member) { res.status(404).json({ error: "Member not found" }); return }

    let healthProfileId = member.healthProfile?.id
    if (!healthProfileId) {
      const hp = await prisma.memberHealthProfile.create({ data: { memberId: member.id, tenantId: req.tenantId! } })
      healthProfileId = hp.id
    }

    const { type, value, unit, notes } = req.body
    const measurement = await prisma.bodyMeasurement.create({
      data: { tenantId: req.tenantId!, memberId: member.id, healthProfileId, type, value: parseFloat(value), unit, notes, recordedBy: req.userId }
    })

    res.json(snakeToCamel(measurement))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/members/me/health-profile — Update health profile
router.patch("/me/health-profile", authenticate, async (req: Request, res: Response) => {
  try {
    const member = await prisma.member.findUnique({ where: { userId: req.userId } })
    if (!member) { res.status(404).json({ error: "Member not found" }); return }

    const data = snakeToCamel(req.body)
    const profile = await prisma.memberHealthProfile.upsert({
      where: { memberId: member.id },
      update: data,
      create: { ...data, memberId: member.id, tenantId: req.tenantId! }
    })

    res.json(snakeToCamel(profile))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/members/:memberId/health-assessment — Full health assessment
router.post("/:memberId/health-assessment", authenticate, async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params
    const member = await prisma.member.findFirst({ where: { id: memberId, tenantId: req.tenantId! } })
    if (!member) { res.status(404).json({ error: "Member not found" }); return }

    let hp = await prisma.memberHealthProfile.findUnique({ where: { memberId } })
    if (!hp) {
      hp = await prisma.memberHealthProfile.create({ data: { memberId, tenantId: req.tenantId! } })
    }

    const { bloodPressure, heartRate, bmi, bodyFat, muscleMass, metabolicAge, weight } = req.body

    if (weight || bmi) {
      await prisma.memberHealthProfile.update({
        where: { id: hp.id },
        data: { ...(weight ? { weight: parseFloat(weight) } : {}), ...(bmi ? { bmi: parseFloat(bmi) } : {}) }
      })
    }

    const measurements: { type: string; value: number; unit: string }[] = []
    if (bloodPressure) measurements.push({ type: "blood_pressure", value: 0, unit: bloodPressure })
    if (heartRate) measurements.push({ type: "heart_rate", value: parseFloat(heartRate), unit: "bpm" })
    if (bodyFat) measurements.push({ type: "body_fat", value: parseFloat(bodyFat), unit: "%" })
    if (muscleMass) measurements.push({ type: "muscle_mass", value: parseFloat(muscleMass), unit: "kg" })
    if (metabolicAge) measurements.push({ type: "metabolic_age", value: parseFloat(metabolicAge), unit: "years" })

    for (const m of measurements) {
      await prisma.bodyMeasurement.create({
        data: { tenantId: req.tenantId!, memberId, healthProfileId: hp.id, type: m.type as any, value: m.value, unit: m.unit, recordedBy: req.userId }
      })
    }

    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/members/:memberId/workout_template — Assign weekly template
router.post("/:memberId/workout_template", authenticate, requireRole("super_admin", "gym_owner", "manager", "trainer", "frontdesk"), async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params
    const { templateId, startDate } = req.body

    const template = await prisma.workoutTemplate.findFirst({ where: { id: templateId, tenantId: req.tenantId! } })
    if (!template) { res.status(404).json({ error: "Template not found" }); return }

    const exercises = typeof template.exercises === "string" ? JSON.parse(template.exercises) : template.exercises
    const start = startDate ? new Date(startDate) : new Date()
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    for (const dayPlan of exercises) {
      const planDate = new Date(start)
      const targetDayIndex = dayNames.indexOf(dayPlan.day)
      const currentDayIndex = start.getDay()
      let daysToAdd = targetDayIndex - currentDayIndex
      if (daysToAdd < 0) daysToAdd += 7
      planDate.setDate(planDate.getDate() + daysToAdd)

      const existingPlan = await prisma.dailyWorkoutPlan.findFirst({
        where: { memberId, tenantId: req.tenantId!, date: planDate }
      })

      if (existingPlan) {
        await prisma.dailyWorkoutPlan.update({
          where: { id: existingPlan.id },
          data: { exercises: JSON.stringify(dayPlan.exercises || []), status: "pending", trainerId: req.userId }
        })
      } else {
        await prisma.dailyWorkoutPlan.create({
          data: { memberId, tenantId: req.tenantId!, date: planDate, day: dayPlan.day, exercises: JSON.stringify(dayPlan.exercises || []), trainerId: req.userId }
        })
      }
    }

    res.json({ success: true, assigned: exercises.length })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/members/me/workout-logs — Log a workout completion
router.post("/me/workout-logs", authenticate, requireRole("member"), async (req: Request, res: Response) => {
  try {
    const member = await prisma.member.findUnique({ where: { userId: req.userId } })
    if (!member) { res.status(404).json({ error: "Member not found" }); return }

    const { workoutId, exercises, duration, notes } = req.body

    const log = await prisma.memberWorkout.create({
      data: {
        tenantId: req.tenantId!,
        memberId: member.id,
        workoutId: workoutId || "custom",
        assignedBy: member.assignedTrainerId,
        assignedAt: new Date(),
        completedAt: new Date(),
        notes,
        progress: { duration, exercises }
      }
    })

    res.json(snakeToCamel(log))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
