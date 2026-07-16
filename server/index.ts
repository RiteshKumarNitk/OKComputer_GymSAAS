import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import admin from "firebase-admin"
import { v2 as cloudinary } from "cloudinary"
import { prisma, snakeToCamel, authenticate, AuthenticatedRequest } from "./config/db.js"
import type { Response } from "express"
import { errorMiddleware } from "./middleware/errorMiddleware.js"
import { createCrudRoutes } from "./config/crudHelper.js"
import { requireRole } from "./middleware/requireRole.js"

// Every hand-written route in this file that isn't strictly "everyone except
// member" uses its own explicit role list; this one constant captures the
// common "everyone except member" shape used by the workout-template routes
// below and by the member-workouts-today endpoint's inverse.
const NON_MEMBER_ROLES = ["super_admin", "gym_owner", "manager", "trainer", "frontdesk"] as const

// ──────────────────────────────────────────────
// Route Modules
// ──────────────────────────────────────────────
import authRoutes from "./routes/authRoutes.js"
import memberRoutes from "./routes/memberRoutes.js"
import membershipRoutes from "./routes/membershipRoutes.js"
import attendanceRoutes from "./routes/attendanceRoutes.js"
import paymentRoutes from "./routes/paymentRoutes.js"
import trainerRoutes from "./routes/trainerRoutes.js"
import workoutRoutes from "./routes/workoutRoutes.js"
import staffRoutes from "./routes/staffRoutes.js"
import reportRoutes from "./routes/reportRoutes.js"
import tenantRoutes from "./routes/tenantRoutes.js"
import invoiceRoutes from "./routes/invoiceRoutes.js"
import billingRoutes from "./routes/billingRoutes.js"
import dashboardRoutes from "./routes/dashboardRoutes.js"
import uploadRoutes from "./routes/uploadRoutes.js"
import accessControlRoutes from "./routes/accessControlRoutes.js"
import healthRoutes from "./routes/healthRoutes.js"
import qrRoutes from "./routes/qrRoutes.js"
import messageRoutes from "./routes/messageRoutes.js"
import notificationRoutes from "./routes/notificationRoutes.js"
import campaignRoutes from "./routes/campaignRoutes.js"
import leadAgentRoutes from "./routes/leadAgentRoutes.js"
import { RenewalService } from "./services/renewalService.js"
import { FollowUpService } from "./services/followUpService.js"


dotenv.config()

// ──────────────────────────────────────────────
// Firebase Admin Initialization
// ──────────────────────────────────────────────
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      })
    })
    console.log("✅ Firebase Admin initialized")
  } catch (e: any) {
    console.error("❌ Firebase Admin init error:", e.message)
  }
}

// ──────────────────────────────────────────────
// Express App Setup
// ──────────────────────────────────────────────
const app = express()
const PORT = 3001

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:3000").split(",").map(s => s.trim())

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes("*")) {
      callback(null, true)
    } else {
      console.warn(`CORS blocked origin: ${origin}`)
      callback(new Error("Origin not allowed by CORS"))
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-tenant-id"],
  exposedHeaders: ["X-Total-Count", "X-Page", "X-Limit", "X-Total-Pages"],
}))
app.use(express.json())

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// ──────────────────────────────────────────────
// Mount Route Modules
// ──────────────────────────────────────────────
app.use("/api/auth", authRoutes)
app.use("/api/members", memberRoutes)
app.use("/api/memberships", membershipRoutes)
app.use("/api/attendance", attendanceRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/trainer", trainerRoutes)
app.use("/api/workouts", workoutRoutes)

// NOTE: Member-specific workout routes (/api/member/workouts/*)
// are kept inline because their base path (/api/member) uses a different prefix

// GET /api/member/workouts/today — Member's workout for today
app.get("/api/member/workouts/today", authenticate, requireRole("member"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const member = await prisma.member.findUnique({ where: { userId: req.userId, tenantId: req.tenantId } })
    if (!member) { res.status(404).json({ error: "Member profile not found" }); return }
    const targetDate = new Date()
    targetDate.setHours(0, 0, 0, 0)
    const plan = await prisma.dailyWorkoutPlan.findFirst({
      where: { memberId: member.id, tenantId: req.tenantId, date: targetDate }
    })
    if (!plan) { res.json(null); return }
    res.json(snakeToCamel(plan))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/member/workouts/:id — Update daily workout plan
app.patch("/api/member/workouts/:id", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const tenantId = req.tenantId
    if (req.role === "member") {
      const member = await prisma.member.findUnique({ where: { userId: req.userId, tenantId } })
      if (!member) { res.status(403).json({ error: "Member profile not found" }); return }
      const existingPlan = await prisma.dailyWorkoutPlan.findFirst({ where: { id, tenantId, memberId: member.id } })
      if (!existingPlan) { res.status(403).json({ error: "Access denied or plan not found" }); return }
    }
    const { exercises, progress, status } = req.body
    const updated = await prisma.dailyWorkoutPlan.update({
      where: { id, tenantId },
      data: { ...(exercises ? { exercises } : {}), ...(progress ? { progress } : {}), ...(status ? { status } : {}) }
    })
    res.json(snakeToCamel(updated))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ──────────────────────────────────────────────
// WORKOUT TEMPLATES
// ──────────────────────────────────────────────

// GET /api/workout_templates
app.get("/api/workout_templates", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const templates = await prisma.workoutTemplate.findMany({
      where: { tenantId: req.tenantId, isActive: true },
      orderBy: { isDefault: "desc" }
    })
    res.json(templates.map(snakeToCamel))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/workout_templates
app.post("/api/workout_templates", authenticate, requireRole(...NON_MEMBER_ROLES), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, days, exercises } = req.body
    const template = await prisma.workoutTemplate.create({
      data: { tenantId: req.tenantId, name, description, days: days || 7, exercises: typeof exercises === "string" ? exercises : JSON.stringify(exercises || []) }
    })
    res.json(snakeToCamel(template))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/workout_templates/:id
app.patch("/api/workout_templates/:id", authenticate, requireRole(...NON_MEMBER_ROLES), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const { name, description, days, exercises, isActive, isDefault } = req.body
    const updateData: any = {}
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (days) updateData.days = days
    if (exercises) updateData.exercises = typeof exercises === "string" ? exercises : JSON.stringify(exercises)
    if (isActive !== undefined) updateData.isActive = isActive
    if (isDefault !== undefined) updateData.isDefault = isDefault
    const result = await prisma.workoutTemplate.updateMany({ where: { id, tenantId: req.tenantId }, data: updateData })
    if (result.count === 0) { res.status(404).json({ error: "Template not found" }); return }
    const template = await prisma.workoutTemplate.findFirst({ where: { id, tenantId: req.tenantId } })
    res.json(snakeToCamel(template))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/workout_templates/:id
app.delete("/api/workout_templates/:id", authenticate, requireRole(...NON_MEMBER_ROLES), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const result = await prisma.workoutTemplate.deleteMany({ where: { id, tenantId: req.tenantId } })
    if (result.count === 0) { res.status(404).json({ error: "Template not found" }); return }
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})
app.use("/api/staff", staffRoutes)
app.use("/api/reports", reportRoutes)
app.use("/api/tenants", tenantRoutes)
app.use("/api/invoices", invoiceRoutes)
app.use("/api/billing", billingRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/upload", uploadRoutes)
app.use("/api/access-controls", accessControlRoutes)
app.use("/api/health", healthRoutes)

// ──────────────────────────────────────────────
// Phase 1 — New Modules
// ──────────────────────────────────────────────
app.use("/api/qr", qrRoutes)
app.use("/api/messages", messageRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/campaigns", campaignRoutes)
app.use("/api/lead-agent", leadAgentRoutes)

// ──────────────────────────────────────────────
// Register Generic CRUD Routes
// ──────────────────────────────────────────────

createCrudRoutes(app, "members", "member", {
  searchFields: ["fullName", "email", "memberCode"],
  filterFields: ["status"],
  include: { currentPlan: true, assignedTrainer: true, healthProfile: { include: { measurements: true } }, fitnessStats: true },
  roles: {
    list: ["gym_owner", "manager", "frontdesk", "member"],
    create: ["gym_owner", "manager", "frontdesk"],
    update: ["gym_owner", "manager"],
    delete: ["gym_owner"]
  }
})
createCrudRoutes(app, "memberships", "membership", { filterFields: ["isActive"] })
createCrudRoutes(app, "trainers", "trainer", { searchFields: ["fullName", "email"], filterFields: ["isActive"] })
createCrudRoutes(app, "trainer-slots", "trainerSlot", { include: { trainer: true, bookedBy: true }, filterFields: ["trainerId"] })
createCrudRoutes(app, "schedules", "schedule", {
  include: { service: true, trainer: true },
  roles: { list: ["admin", "manager", "staff", "trainer", "member"] }
})
createCrudRoutes(app, "workouts", "workout")
createCrudRoutes(app, "diet-plans", "dietPlan")
createCrudRoutes(app, "services", "service")
createCrudRoutes(app, "branches", "branch")
createCrudRoutes(app, "leads", "lead", { searchFields: ["fullName", "email", "phone"], filterFields: ["status", "priority"] })
createCrudRoutes(app, "follow-ups", "followUp", { include: { lead: true, member: true }, filterFields: ["status", "type", "priority"] })
createCrudRoutes(app, "visitors", "visitor")
createCrudRoutes(app, "complaints", "complaint", { include: { member: { select: { fullName: true } } }, filterFields: ["status", "priority"] })
createCrudRoutes(app, "invoices", "invoice", { filterFields: ["status", "memberId"] })
createCrudRoutes(app, "expenses", "expense", { filterFields: ["category"] })
createCrudRoutes(app, "products", "product")
createCrudRoutes(app, "lockers", "locker", { include: { member: { select: { fullName: true, memberCode: true } } }, filterFields: ["status"] })
createCrudRoutes(app, "front-desk", "frontDesk", { include: { user: { select: { email: true } } } })
createCrudRoutes(app, "notifications", "notification")
createCrudRoutes(app, "member-workouts", "memberWorkout", { include: { workout: true }, filterFields: ["memberId"] })
createCrudRoutes(app, "users", "userProfile", {
  searchFields: ["fullName", "email"],
  filterFields: ["role", "isActive"],
  include: { trainer: true },
  roles: { list: ["gym_owner"], create: ["gym_owner"], update: ["gym_owner"], delete: ["gym_owner"] }
})
createCrudRoutes(app, "member-diets", "memberDiet", { include: { dietPlan: true }, filterFields: ["memberId"] })
createCrudRoutes(app, "payments", "payment", { filterFields: ["status", "memberId"] })
createCrudRoutes(app, "tenants", "tenant", {
  roles: { list: ["super_admin", "gym_owner", "manager", "frontdesk"], create: ["super_admin"], update: ["super_admin", "gym_owner"], delete: ["super_admin"] }
})
createCrudRoutes(app, "saas_plans", "saasPlan", {
  filterFields: ["isActive"],
  roles: { list: ["super_admin"], create: ["super_admin"], update: ["super_admin"], delete: ["super_admin"] }
})
createCrudRoutes(app, "saas_subscriptions", "saasSubscription", {
  filterFields: ["tenantId", "status"],
  include: { plan: true },
  roles: { list: ["super_admin"], create: ["super_admin"], update: ["super_admin"], delete: ["super_admin"] }
})
createCrudRoutes(app, "saas_invoices", "saasInvoice", {
  filterFields: ["tenantId", "status"],
  include: { tenant: { select: { name: true } } },
  roles: { list: ["super_admin"], create: ["super_admin"], update: ["super_admin"], delete: ["super_admin"] }
})


// ──────────────────────────────────────────────
// Phase 1 — Automated Jobs (Runs every 6 hours)
// ──────────────────────────────────────────────
const PHASE1_JOB_INTERVAL = 6 * 60 * 60 * 1000

async function runPhase1Jobs() {
  try {
    console.log("\n========== Phase 1 Automated Jobs ==========")

    // 1. Renewal Reminders
    const renewalResult = await RenewalService.processReminders()
    console.log(`[Phase1] Renewal reminders sent: ${renewalResult.reminded}, expired: ${renewalResult.expired}`)

    // 2. Auto-schedule follow-ups for unattended leads
    const followUpResult = await FollowUpService.autoScheduleFollowUps()
    console.log(`[Phase1] Auto-scheduled follow-ups: ${followUpResult.created}`)

    // 3. Detect missed follow-ups
    const missedResult = await FollowUpService.detectMissedFollowUps()
    console.log(`[Phase1] Missed follow-ups detected: ${missedResult.missed}`)

    console.log("============================================\n")
  } catch (err: any) {
    console.error("[Phase1 Jobs] Error:", err.message)
  }
}

// Run jobs immediately on start, then every 6 hours
runPhase1Jobs()
setInterval(runPhase1Jobs, PHASE1_JOB_INTERVAL)

// Legacy alert cron (kept for backward compatibility, runs daily)
setInterval(async () => {
  try {
    console.log("[Alert Cron] Checking for expiring memberships...")
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 3)

    const expiringMembers = await prisma.member.findMany({
      where: {
        status: "active",
        planExpiresAt: {
          gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          lt: new Date(targetDate.setHours(23, 59, 59, 999))
        }
      }
    })

    expiringMembers.forEach((m: any) => {
      console.log(`[Alert Cron] Dispatched warning to ${m.fullName || m.full_name} (${m.phone})`)
    })
  } catch (err: any) {
    console.error("[Alert Cron] Error:", err.message)
  }
}, 24 * 60 * 60 * 1000)

// ──────────────────────────────────────────────
// Start Server & Error Middleware
// ──────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`✅ API server running on http://localhost:${PORT}`)
  })
}

app.use(errorMiddleware)

export default app
