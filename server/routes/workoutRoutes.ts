import { Router, Request, Response } from "express"
import { prisma, authenticate, snakeToCamel } from "../config/db.js"

const router = Router()

// GET /api/workouts — List workouts and templates
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const [workouts, templates] = await Promise.all([
      prisma.workout.findMany({ where: { tenantId: req.tenantId! }, orderBy: { name: "asc" } }),
      prisma.workoutTemplate.findMany({ where: { tenantId: req.tenantId!, isActive: true }, orderBy: { isDefault: "desc" } })
    ])

    const combined = [
      ...workouts.map(w => ({ ...w, type: "workout" })),
      ...templates.map(t => ({ ...t, type: "template" }))
    ]

    res.json(combined.map(snakeToCamel))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/workouts/assign — Assign workout to member
router.post("/assign", authenticate, async (req: Request, res: Response) => {
  try {
    const { memberId, workoutId, notes } = snakeToCamel(req.body)
    const tenantId = req.tenantId!

    const assignment = await prisma.memberWorkout.create({
      data: { tenantId, memberId, workoutId, notes, assignedAt: new Date() }
    })

    res.json(snakeToCamel(assignment))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})



export default router
