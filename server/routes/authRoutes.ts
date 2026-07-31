import { Router, Request, Response } from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import admin from "firebase-admin"
import { prisma, authenticate, snakeToCamel, JWT_SECRET } from "../config/db.js"
import { validate } from "../middleware/validate.js"
import { loginSchema, registerSchema, setupAdminSchema } from "../validators/authValidators.js"
import { ipRateLimiter } from "../middleware/rateLimiter.js"
import { requireRole } from "../middleware/requireRole.js"
import { logAudit } from "../lib/auditLog.js"
import AuthController from "../controllers/authController.js"

const router = Router()

// Send OTP (from controller)
router.post("/send-otp", ipRateLimiter, AuthController.sendOtp)

// Verify OTP (from controller)
router.post("/verify-otp", ipRateLimiter, AuthController.verifyOtp)

// POST /api/auth/phone — Phone number authentication (Firebase)
router.post("/phone", async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body
    if (!idToken) { res.status(400).json({ error: "idToken is required" }); return }

    let phoneNumber: string | undefined

    if (process.env.NODE_ENV !== "production") {
      if (idToken === "TEST_BYPASS") {
        phoneNumber = req.body.phone
      } else if (idToken === "123456" || idToken === "FIREBASE_TEST_TOKEN") {
        phoneNumber = "+11234567890"
      }
    } else {
      const decodedToken = await admin.auth().verifyIdToken(idToken)
      phoneNumber = decodedToken.phone_number
    }

    if (!phoneNumber) { res.status(400).json({ error: "Invalid token: phone number missing" }); return }

    const user = await prisma.userProfile.findFirst({ where: { phone: phoneNumber } })
    if (!user) { res.status(404).json({ error: "User not found with this phone number" }); return }

    const token = jwt.sign(
      { userId: user.id, role: user.role, tenantId: user.tenantId },
      JWT_SECRET,
      { expiresIn: "30d" }
    )

    res.json({ token, user: { id: user.id, fullName: user.fullName, phone: user.phone, role: user.role, tenantId: user.tenantId } })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/register — Create user/tenant
router.post("/register", validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) { res.status(401).json({ error: "Authentication required. Only Super Admin can create accounts." }); return }

    let caller: any
    try {
      const token = authHeader.replace("Bearer ", "")
      caller = jwt.verify(token, JWT_SECRET) as any
    } catch {
      res.status(401).json({ error: "Invalid token" }); return
    }

    let allowedRoles: string[] = []
    if (caller.role === "super_admin") {
      allowedRoles = ["super_admin", "gym_owner", "manager", "trainer", "frontdesk"]
    } else if (caller.role === "gym_owner") {
      allowedRoles = ["manager", "trainer", "frontdesk"]
    } else {
      res.status(403).json({ error: "Only Super Admin or Gym Owner can create accounts", debug_role: caller.role }); return
    }

    const { email, password, fullName, role, tenantId } = req.body
    const targetRole = role || "gym_owner"

    if (!allowedRoles.includes(targetRole)) {
      res.status(403).json({ error: `You are not allowed to create a user with role ${targetRole}`, debug_allowed: allowedRoles }); return
    }
    if (!email || !password || !fullName) {
      res.status(400).json({ error: "Email, password, and fullName required" }); return
    }

    const existing = await prisma.userProfile.findUnique({ where: { email } })
    if (existing) { res.status(409).json({ error: "Email already registered" }); return }

    const hashed = await bcrypt.hash(password, 10)

    const result = await prisma.$transaction(async (tx: any) => {
      let finalTenantId = caller.role === "gym_owner" ? caller.tenantId : tenantId

      if (!finalTenantId) {
        const tenant = await tx.tenant.create({
          data: { name: `${fullName}'s Gym`, slug: email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-") + "-gym" }
        })
        finalTenantId = tenant.id
      }

      const user = await tx.userProfile.create({
        data: { email, passwordHash: hashed, fullName, role: targetRole, tenantId: finalTenantId }
      })

      if (targetRole === "trainer") {
        await tx.trainer.create({
          data: { userId: user.id, tenantId: finalTenantId, fullName, email, isActive: true }
        })
      }

      if (!tenantId) {
        await tx.tenant.update({ where: { id: finalTenantId }, data: { ownerUserId: user.id } })
      }

      return user
    })

    const token = jwt.sign(
      { id: result.id, email: result.email, role: result.role, tenantId: result.tenantId },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    logAudit({
      tenantId: result.tenantId, userId: caller.id ?? caller.userId,
      action: "user_registered", resourceType: "UserProfile", resourceId: result.id,
      changes: { email: result.email, role: result.role },
    }).catch(() => {})

    res.json({ user: { id: result.id, email: result.email, fullName: result.fullName, role: result.role, tenantId: result.tenantId }, token })
  } catch (err: any) {
    console.error("Register error:", err)
    res.status(500).json({ error: err.message || "Registration failed" })
  }
})

// POST /api/auth/setup-admin — One-time super admin creation
router.post("/setup-admin", validate(setupAdminSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body

    const adminCount = await prisma.userProfile.count({ where: { role: "super_admin" } })
    if (adminCount > 0) {
      res.status(403).json({ error: "Super Admin already exists. For security, this endpoint is disabled." }); return
    }

    const hashed = await bcrypt.hash(password, 10)

    const result = await prisma.$transaction(async (tx: any) => {
      let systemTenant = await tx.tenant.findUnique({ where: { slug: "system" } })
      if (!systemTenant) {
        systemTenant = await tx.tenant.create({ data: { name: "System Administrator", slug: "system", email } })
      }

      const user = await tx.userProfile.create({
        data: { email, passwordHash: hashed, fullName, role: "super_admin", tenantId: systemTenant.id }
      })

      await tx.tenant.update({ where: { id: systemTenant.id }, data: { ownerUserId: user.id } })
      return user
    })

    const token = jwt.sign(
      { id: result.id, email: result.email, role: result.role, tenantId: result.tenantId },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    logAudit({
      tenantId: result.tenantId, userId: result.id,
      action: "super_admin_created", resourceType: "UserProfile", resourceId: result.id,
      changes: { email: result.email },
    }).catch(() => {})

    res.json({
      message: "Super Admin created successfully",
      user: { id: result.id, email: result.email, fullName: result.fullName, role: result.role, tenantId: result.tenantId },
      token
    })
  } catch (err: any) {
    console.error("Setup Admin error:", err)
    res.status(500).json({ error: err.message || "Setup failed" })
  }
})

// POST /api/auth/login — Login with email/password
router.post("/login", ipRateLimiter, validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const user = await prisma.userProfile.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      logAudit({ action: "login_failed", resourceType: "Auth", changes: { email, reason: "no_such_user" } }).catch(() => {})
      res.status(401).json({ error: "Invalid credentials" }); return
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      logAudit({ tenantId: user.tenantId, userId: user.id, action: "login_failed", resourceType: "Auth", resourceId: user.id, changes: { email, reason: "wrong_password" } }).catch(() => {})
      res.status(401).json({ error: "Invalid credentials" }); return
    }
    if (!user.isActive) {
      logAudit({ tenantId: user.tenantId, userId: user.id, action: "login_failed", resourceType: "Auth", resourceId: user.id, changes: { email, reason: "account_disabled" } }).catch(() => {})
      res.status(403).json({ error: "Account disabled" }); return
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    logAudit({ tenantId: user.tenantId, userId: user.id, action: "login_success", resourceType: "Auth", resourceId: user.id }).catch(() => {})

    res.json({
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, tenantId: user.tenantId, avatarUrl: user.avatarUrl },
      token
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Login failed" })
  }
})

// GET /api/auth/session — Verify session token
router.get("/session", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization
  if (!authHeader) { res.json({ user: null }); return }

  try {
    const token = authHeader.replace("Bearer ", "")
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = await prisma.userProfile.findUnique({ where: { id: decoded.id } })
    if (!user) { res.json({ user: null }); return }
    res.json({ user: { id: user.id, email: user.email, name: user.fullName, role: user.role, tenantId: user.tenantId } })
  } catch {
    res.json({ user: null })
  }
})

// POST /api/auth/impersonate — Super admin impersonation
router.post("/impersonate", authenticate, requireRole("super_admin"), async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.body
    if (!tenantId) { res.status(400).json({ error: "Tenant ID required." }); return }

    const owner = await prisma.userProfile.findFirst({ where: { tenantId, role: "gym_owner" } })
    if (!owner) { res.status(404).json({ error: "Tenant owner not found." }); return }

    const token = jwt.sign(
      { id: owner.id, email: owner.email, role: owner.role, tenantId: owner.tenantId },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    // Impersonation is one of the most sensitive actions a super_admin can
    // take — logged with the ACTING super_admin's own userId (req.userId),
    // not the impersonated owner's, so "who did this" is always the caller.
    logAudit({
      tenantId, userId: req.userId,
      action: "impersonate", resourceType: "Tenant", resourceId: tenantId,
      changes: { impersonatedUserId: owner.id, impersonatedEmail: owner.email },
    }).catch(() => {})

    res.json({ token, user: { id: owner.id, email: owner.email, role: owner.role, tenantId: owner.tenantId, fullName: owner.fullName } })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
