import express from "express"
import cors from "cors"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import { v2 as cloudinary } from "cloudinary"
import multer from "multer"

dotenv.config()

const app = express()
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const PORT = 3001

app.use(cors())
app.use(express.json())

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "gym-saas-secret-key"

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Multer for file processing
const storage = multer.memoryStorage()
const upload = multer({ storage })

// Snake_case → camelCase converter for Supabase shim compatibility
function snakeToCamel(obj: any): any {
    if (Array.isArray(obj)) return obj.map(snakeToCamel)
    if (obj === null || typeof obj !== "object" || obj instanceof Date) return obj
    const result: any = {}
    for (const [key, value] of Object.entries(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
        result[camelKey] = (typeof value === "object" && value !== null && !(value instanceof Date))
            ? snakeToCamel(value) : value
    }
    return result
}

// ==================== AUTH ====================

app.post("/api/auth/register", async (req, res) => {
    try {
        // Only super_admin can create tenants/users
        const authHeader = req.headers.authorization
        if (!authHeader) return res.status(401).json({ error: "Authentication required. Only Super Admin can create accounts." })

        let caller: any
        try {
            const token = authHeader.replace("Bearer ", "")
            caller = jwt.verify(token, JWT_SECRET) as any
        } catch {
            return res.status(401).json({ error: "Invalid token" })
        }

        if (caller.role !== "super_admin") {
            return res.status(403).json({ error: "Only Super Admin can create accounts" })
        }

        const { email, password, fullName, role, tenantId } = req.body
        if (!email || !password || !fullName) {
            return res.status(400).json({ error: "Email, password, and fullName required" })
        }

        const existing = await prisma.userProfile.findUnique({ where: { email } })
        if (existing) return res.status(409).json({ error: "Email already registered" })

        const hashed = await bcrypt.hash(password, 10)

        const result = await prisma.$transaction(async (tx: any) => {
            let finalTenantId = tenantId

            // If no tenantId, create a new tenant (gym owner signup)
            if (!finalTenantId) {
                const tenant = await tx.tenant.create({
                    data: {
                        name: `${fullName}'s Gym`,
                        slug: email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-") + "-gym",
                    },
                })
                finalTenantId = tenant.id
            }

            const user = await tx.userProfile.create({
                data: {
                    email,
                    password: hashed,
                    fullName,
                    role: role || "gym_owner",
                    tenantId: finalTenantId,
                },
            })

            // Update tenant owner
            if (!tenantId) {
                await tx.tenant.update({
                    where: { id: finalTenantId },
                    data: { ownerUserId: user.id },
                })
            }

            return user
        })

        const token = jwt.sign(
            { id: result.id, email: result.email, role: result.role, tenantId: result.tenantId },
            JWT_SECRET,
            { expiresIn: "7d" }
        )

        res.json({
            user: { id: result.id, email: result.email, fullName: result.fullName, role: result.role, tenantId: result.tenantId },
            token,
        })
    } catch (err: any) {
        console.error("Register error:", err)
        res.status(500).json({ error: err.message || "Registration failed" })
    }
})

app.post("/api/auth/setup-admin", async (req, res) => {
    try {
        const { email, password, fullName } = req.body
        if (!email || !password || !fullName) {
            return res.status(400).json({ error: "Email, password, and fullName required" })
        }

        // Check if any super_admin already exists
        const adminCount = await prisma.userProfile.count({
            where: { role: "super_admin" }
        })

        if (adminCount > 0) {
            return res.status(403).json({ error: "Super Admin already exists. For security, this endpoint is disabled." })
        }

        const hashed = await bcrypt.hash(password, 10)

        const result = await prisma.$transaction(async (tx: any) => {
            // Create a default system tenant if it doesn't exist
            let systemTenant = await tx.tenant.findUnique({ where: { slug: "system" } })
            if (!systemTenant) {
                systemTenant = await tx.tenant.create({
                    data: {
                        name: "System Administrator",
                        slug: "system",
                        email: email,
                    }
                })
            }

            const user = await tx.userProfile.create({
                data: {
                    email,
                    password: hashed,
                    fullName,
                    role: "super_admin",
                    tenantId: systemTenant.id,
                },
            })

            // Update tenant owner
            await tx.tenant.update({
                where: { id: systemTenant.id },
                data: { ownerUserId: user.id },
            })

            return user
        })

        const token = jwt.sign(
            { id: result.id, email: result.email, role: result.role, tenantId: result.tenantId },
            JWT_SECRET,
            { expiresIn: "7d" }
        )

        res.json({
            message: "Super Admin created successfully",
            user: { id: result.id, email: result.email, fullName: result.fullName, role: result.role, tenantId: result.tenantId },
            token,
        })
    } catch (err: any) {
        console.error("Setup Admin error:", err)
        res.status(500).json({ error: err.message || "Setup failed" })
    }
})

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) return res.status(400).json({ error: "Email and password required" })

        const user = await prisma.userProfile.findUnique({ where: { email } })
        if (!user || !user.password) return res.status(401).json({ error: "Invalid credentials" })

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return res.status(401).json({ error: "Invalid credentials" })
        if (!user.isActive) return res.status(403).json({ error: "Account disabled" })

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
            JWT_SECRET,
            { expiresIn: "7d" }
        )

        res.json({
            user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, tenantId: user.tenantId, avatarUrl: user.avatarUrl },
            token,
        })
    } catch (err: any) {
        res.status(500).json({ error: err.message || "Login failed" })
    }
})

app.get("/api/auth/session", async (req, res) => {
    const authHeader = req.headers.authorization
    if (!authHeader) return res.json({ user: null })

    try {
        const token = authHeader.replace("Bearer ", "")
        const decoded = jwt.verify(token, JWT_SECRET) as any
        const user = await prisma.userProfile.findUnique({ where: { id: decoded.id } })
        if (!user) return res.json({ user: null })
        res.json({ user: { id: user.id, email: user.email, name: user.fullName, role: user.role, tenantId: user.tenantId } })
    } catch {
        res.json({ user: null })
    }
})

// ==================== GENERIC CRUD HELPER ====================

function createCrudRoutes(
    path: string,
    modelName: string,
    opts?: { searchFields?: string[]; filterFields?: string[]; include?: any }
) {
    const model = (prisma as any)[modelName]

    // LIST
    app.get(`/api/${path}`, async (req, res) => {
        try {
            const where: any = {}
            if (req.query.tenantId) where.tenantId = req.query.tenantId as string
            if (req.query.id) {
                const item = await model.findUnique({ where: { id: req.query.id }, ...(opts?.include ? { include: opts.include } : {}) })
                return res.json(snakeToCamel(item))
            }
            if (req.query.search && opts?.searchFields?.length) {
                where.OR = opts.searchFields.map((f: string) => ({ [f]: { contains: req.query.search as string, mode: "insensitive" } }))
            }
            if (opts?.filterFields) {
                for (const f of opts.filterFields) {
                    if (req.query[f] && req.query[f] !== "all") where[f] = req.query[f] as string
                }
            }
            if (req.query.memberId) where.memberId = req.query.memberId as string
            if (req.query.trainerId) where.trainerId = req.query.trainerId as string

            const items = await model.findMany({
                where,
                ...(opts?.include ? { include: opts.include } : {}),
                orderBy: { createdAt: "desc" },
            })
            res.json(snakeToCamel(items))
        } catch (err: any) {
            res.status(500).json({ error: err.message })
        }
    })

    // CREATE
    app.post(`/api/${path}`, async (req, res) => {
        try {
            const data = Array.isArray(req.body) ? snakeToCamel(req.body[0]) : snakeToCamel(req.body)
            const item = await model.create({ data })
            res.json(snakeToCamel(item))
        } catch (err: any) {
            console.error(`POST /api/${path} error:`, err.message)
            res.status(500).json({ error: err.message })
        }
    })

    // UPDATE
    app.patch(`/api/${path}`, async (req, res) => {
        try {
            const id = req.query.id as string
            if (!id) return res.status(400).json({ error: "ID required" })
            const item = await model.update({ where: { id }, data: snakeToCamel(req.body) })
            res.json(snakeToCamel(item))
        } catch (err: any) {
            res.status(500).json({ error: err.message })
        }
    })

    // DELETE
    app.delete(`/api/${path}`, async (req, res) => {
        try {
            const id = req.query.id as string
            if (!id) return res.status(400).json({ error: "ID required" })
            await model.delete({ where: { id } })
            res.json({ success: true })
        } catch (err: any) {
            res.status(500).json({ error: err.message })
        }
    })
}

// ==================== REGISTER ALL ROUTES ====================

createCrudRoutes("members", "member", {
    searchFields: ["fullName", "email", "memberCode"],
    filterFields: ["status"],
    include: { currentPlan: true, assignedTrainer: true },
})
createCrudRoutes("memberships", "membership", { filterFields: ["isActive"] })
createCrudRoutes("trainers", "trainer", { searchFields: ["fullName", "email"], filterFields: ["isActive"] })
createCrudRoutes("trainer-slots", "trainerSlot", { include: { trainer: true, bookedBy: true }, filterFields: ["trainerId"] })
createCrudRoutes("schedules", "schedule", { include: { service: true, trainer: true } })
createCrudRoutes("workouts", "workout")
createCrudRoutes("diet-plans", "dietPlan")
createCrudRoutes("services", "service")
createCrudRoutes("branches", "branch")
createCrudRoutes("leads", "lead", { searchFields: ["fullName", "email", "phone"], filterFields: ["status"] })
createCrudRoutes("visitors", "visitor")
createCrudRoutes("complaints", "complaint", { include: { member: { select: { fullName: true } } }, filterFields: ["status", "priority"] })
createCrudRoutes("expenses", "expense", { filterFields: ["category"] })
createCrudRoutes("products", "product")
createCrudRoutes("lockers", "locker", { include: { member: { select: { fullName: true, memberCode: true } } }, filterFields: ["status"] })
createCrudRoutes("front-desk", "frontDesk", { include: { user: { select: { email: true } } } })
createCrudRoutes("notifications", "notification")
createCrudRoutes("member-workouts", "memberWorkout", { include: { workout: true }, filterFields: ["memberId"] })
createCrudRoutes("member-diets", "memberDiet", { include: { dietPlan: true }, filterFields: ["memberId"] })
createCrudRoutes("payments", "payment", { filterFields: ["status", "memberId"] })
createCrudRoutes("users", "userProfile", { searchFields: ["fullName", "email"], filterFields: ["role", "isActive"] })
createCrudRoutes("saas_plans", "saasPlan", { filterFields: ["isActive"] })
createCrudRoutes("saas_subscriptions", "saasSubscription", { filterFields: ["tenantId", "status"], include: { plan: true } })
createCrudRoutes("saas_invoices", "saasInvoice", { filterFields: ["tenantId", "status"], include: { tenant: { select: { name: true } } } })

// ==================== TENANTS ====================

app.get("/api/tenants", async (_req, res) => {
    const tenants = await prisma.tenant.findMany({
        include: { _count: { select: { members: true, users: true } } },
        orderBy: { createdAt: "desc" },
    })
    res.json(snakeToCamel(tenants))
})

app.post("/api/tenants", async (req, res) => {
    try {
        console.log("Creating tenant with body:", JSON.stringify(req.body, null, 2))
        const body = Array.isArray(req.body) ? req.body[0] : req.body
        const { ownerPassword, owner_password, ...rest } = body
        const password = ownerPassword || owner_password

        const converted = snakeToCamel(rest)
        console.log("Converted data for Prisma:", JSON.stringify(converted, null, 2))

        // Pick fields carefully - if some are missing in Prisma Client, this will still error but we catch it
        const data: any = {
            name: converted.name,
            slug: converted.slug,
            ownerName: converted.ownerName,
            ownerEmail: converted.ownerEmail,
            ownerPhone: converted.ownerPhone,
            ownerPhotoUrl: converted.ownerPhotoUrl,
            phone: converted.phone || converted.ownerPhone,
            email: converted.email || converted.ownerEmail,
            currency: converted.currency || converted.billingCurrency || "INR",
            logoUrl: converted.logoUrl,
            businessType: converted.businessType || "gym",
            registeredAddress: converted.registeredAddress,
            paymentGatewayPreference: converted.paymentGatewayPreference || "cash",
            invoicePrefix: converted.invoicePrefix || "GYM",
            subscriptionStatus: converted.subscriptionStatus || "active",
            subscriptionExpiresAt: converted.subscriptionExpiresAt ? new Date(converted.subscriptionExpiresAt) : null,
            status: converted.status || "active",
        }

        // Clean nulls/undefined for Prisma strictness
        Object.keys(data).forEach(key => (data[key] === undefined || data[key] === null) && delete data[key])

        if (password && data.ownerEmail) {
            const result = await prisma.$transaction(async (tx: any) => {
                const tenant = await tx.tenant.create({ data })
                const hashed = await bcrypt.hash(password, 10)
                await tx.userProfile.create({
                    data: {
                        email: data.ownerEmail,
                        password: hashed,
                        fullName: data.ownerName || data.name,
                        role: "gym_owner",
                        tenantId: tenant.id
                    }
                })
                // We don't necessarily need to update ownerUserId here if it's handled by relations, 
                // but let's keep it for compatibility if it's in the schema
                return tenant
            })
            return res.json(snakeToCamel(result))
        }

        const tenant = await prisma.tenant.create({ data })
        res.json(snakeToCamel(tenant))
    } catch (err: any) {
        console.error("CRITICAL: POST /api/tenants failure:", err.message)
        res.status(500).json({ error: err.message })
    }
})

app.patch("/api/tenants", async (req, res) => {
    const id = req.query.id as string
    if (!id) return res.status(400).json({ error: "ID required" })
    const tenant = await prisma.tenant.update({ where: { id }, data: snakeToCamel(req.body) })
    res.json(snakeToCamel(tenant))
})

app.delete("/api/tenants", async (req, res) => {
    const id = req.query.id as string
    if (!id) return res.status(400).json({ error: "ID required" })
    await prisma.tenant.delete({ where: { id } })
    res.json({ success: true })
})

// ==================== DASHBOARD ====================

app.get("/api/dashboard", async (req, res) => {
    try {
        const tenantId = req.query.tenantId as string
        if (!tenantId) return res.status(400).json({ error: "tenantId required" })

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

// ==================== ATTENDANCE (specialized) ====================

app.get("/api/attendance", async (req, res) => {
    try {
        const where: any = {}
        if (req.query.tenantId) where.tenantId = req.query.tenantId as string
        if (req.query.memberId) where.memberId = req.query.memberId as string
        if (req.query.date) {
            const d = new Date(req.query.date as string)
            where.checkinAt = { gte: new Date(d.setHours(0, 0, 0, 0)), lte: new Date(d.setHours(23, 59, 59, 999)) }
        }
        const records = await prisma.attendance.findMany({
            where,
            include: { member: { select: { fullName: true, memberCode: true } } },
            orderBy: { checkinAt: "desc" },
        })
        res.json(records)
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

app.post("/api/attendance", async (req, res) => {
    try {
        const record = await prisma.attendance.create({ data: req.body })
        res.json(record)
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

app.patch("/api/attendance", async (req, res) => {
    try {
        const id = req.query.id as string
        if (!id) return res.status(400).json({ error: "ID required" })
        const record = await prisma.attendance.update({ where: { id }, data: { checkoutAt: new Date() } })
        res.json(record)
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

// ==================== BILLING ====================

app.get("/api/billing", async (req, res) => {
    try {
        const type = req.query.type as string
        const tenantId = req.query.tenantId as string

        if (type === "plans") {
            const plans = await prisma.saasPlan.findMany({ where: { isActive: true }, orderBy: { priceInr: "asc" } })
            return res.json(plans)
        }
        if (type === "subscription" && tenantId) {
            const sub = await prisma.saasSubscription.findFirst({ where: { tenantId }, include: { plan: true }, orderBy: { createdAt: "desc" } })
            return res.json(sub)
        }
        if (type === "invoices" && tenantId) {
            const invoices = await prisma.saasInvoice.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } })
            return res.json(invoices)
        }
        res.status(400).json({ error: "type parameter required" })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

// ==================== REPORTS ====================

app.get("/api/reports", async (req, res) => {
    try {
        const tenantId = req.query.tenantId as string
        const type = req.query.type as string
        if (!tenantId) return res.status(400).json({ error: "tenantId required" })

        if (type === "revenue") {
            const payments = await prisma.payment.findMany({
                where: { tenantId, status: "paid" },
                select: { amountCents: true, paidAt: true },
                orderBy: { paidAt: "asc" },
            })
            return res.json(payments)
        }
        if (type === "attendance") {
            const records = await prisma.attendance.findMany({ where: { tenantId }, select: { checkinAt: true }, orderBy: { checkinAt: "asc" } })
            return res.json(records)
        }
        if (type === "member-growth") {
            const members = await prisma.member.findMany({ where: { tenantId }, select: { createdAt: true }, orderBy: { createdAt: "asc" } })
            return res.json(members)
        }
        res.status(400).json({ error: "type parameter required" })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

// ==================== UPLOAD (Cloudinary) ====================

app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file provided" })

        // Convert buffer to base64
        const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`

        const uploadResponse = await cloudinary.uploader.upload(fileStr, {
            folder: "gym_saas_uploads",
        })

        res.json({
            url: uploadResponse.secure_url,
            publicId: uploadResponse.public_id
        })
    } catch (err: any) {
        console.error("Cloudinary upload error:", err)
        res.status(500).json({ error: "Upload failed" })
    }
})

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log(`✅ API server running on http://localhost:${PORT}`)
})

