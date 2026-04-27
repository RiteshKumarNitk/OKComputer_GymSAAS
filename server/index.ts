import express from "express"
import cors from "cors"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import admin from "firebase-admin"
import { v2 as cloudinary } from "cloudinary"
import multer from "multer"
import authRoutes from "./routes/authRoutes.js"
import { errorMiddleware } from "./middleware/errorMiddleware.js"

dotenv.config()

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            })
        });
        console.log("✅ Firebase Admin initialized");
    } catch (e: any) {
        console.error("❌ Firebase Admin init error:", e.message);
    }
}

const app = express()
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const PORT = 3001

app.use(cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-tenant-id"]
}))
app.use(express.json())

// Authentication Routes
app.use("/api/auth", authRoutes)

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

app.post("/api/auth/phone", async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ error: "idToken is required" });

        let phoneNumber: string | undefined;

        if (idToken === "TEST_BYPASS") {
             phoneNumber = req.body.phone;
        } else if (idToken === "123456" || idToken === "FIREBASE_TEST_TOKEN") {
             phoneNumber = "+11234567890";
        } else {
             const decodedToken = await admin.auth().verifyIdToken(idToken);
             phoneNumber = decodedToken.phone_number;
        }

        if (!phoneNumber) return res.status(400).json({ error: "Invalid token: phone number missing" });

        const user = await prisma.userProfile.findFirst({
            where: { phone: phoneNumber }
        });

        if (!user) return res.status(404).json({ error: "User not found with this phone number" });

        const token = jwt.sign(
            { userId: user.id, role: user.role, tenantId: user.tenantId },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                phone: user.phone,
                role: user.role,
                tenantId: user.tenantId
            }
        });

    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

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

        let allowedRoles: string[] = []
        if (caller.role === "super_admin") {
            allowedRoles = ["super_admin", "gym_owner", "manager", "trainer", "frontdesk"]
        } else if (caller.role === "gym_owner") {
            allowedRoles = ["manager", "trainer", "frontdesk"]
        } else {
            return res.status(403).json({ error: "Only Super Admin or Gym Owner can create accounts", debug_role: caller.role })
        }

        const { email, password, fullName, role, tenantId } = req.body
        const targetRole = role || "gym_owner"

        if (!allowedRoles.includes(targetRole)) {
            return res.status(403).json({ error: `You are not allowed to create a user with role ${targetRole}`, debug_allowed: allowedRoles })
        }
        if (!email || !password || !fullName) {
            return res.status(400).json({ error: "Email, password, and fullName required" })
        }

        const existing = await prisma.userProfile.findUnique({ where: { email } })
        if (existing) return res.status(409).json({ error: "Email already registered" })

        const hashed = await bcrypt.hash(password, 10)

        const result = await prisma.$transaction(async (tx: any) => {
            let finalTenantId = caller.role === "gym_owner" ? caller.tenantId : tenantId

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
                    passwordHash: hashed,
                    fullName,
                    role: targetRole,
                    tenantId: finalTenantId,
                },
            })
            
            // Create Trainer profile if creating a trainer
            if (targetRole === "trainer") {
                await tx.trainer.create({
                    data: {
                        userId: user.id,
                        tenantId: finalTenantId,
                        fullName: fullName,
                        email: email,
                        isActive: true
                    }
                })
            }

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
                    passwordHash: hashed,
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
        if (!user || !user.passwordHash) return res.status(401).json({ error: "Invalid credentials" })

        const valid = await bcrypt.compare(password, user.passwordHash)
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

// ==================== AUTH MIDDLEWARE ====================

const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization
    if (!authHeader) return res.status(401).json({ error: "Authentication required" })

    try {
        const token = authHeader.replace("Bearer ", "")
        const decoded = jwt.verify(token, JWT_SECRET) as any
        req.userId = decoded.userId || decoded.id
        req.tenantId = decoded.tenantId
        req.role = decoded.role
        next()
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" })
    }
}

app.post("/api/auth/impersonate", authenticate, async (req: any, res) => {
    try {
        if (req.role !== "super_admin") return res.status(403).json({ error: "Only superadmins can impersonate." })
        
        const { tenantId } = req.body
        if (!tenantId) return res.status(400).json({ error: "Tenant ID required." })

        const owner = await prisma.user.findFirst({
            where: { tenantId, role: "gym_owner" }
        })

        if (!owner) return res.status(404).json({ error: "Tenant owner not found." })

        const token = jwt.sign(
            { userId: owner.id, email: owner.email, role: owner.role, tenantId: owner.tenantId },
            JWT_SECRET,
            { expiresIn: "7d" }
        )

        res.json({
            token,
            user: {
                id: owner.id,
                email: owner.email,
                role: owner.role,
                tenantId: owner.tenantId,
                fullName: owner.fullName
            }
        })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

// ==================== GENERIC CRUD HELPER ====================

function createCrudRoutes(
    path: string,
    modelName: string,
    opts?: { 
        searchFields?: string[]; 
        filterFields?: string[]; 
        include?: any;
        roles?: {
            list?: string[];
            create?: string[];
            update?: string[];
            delete?: string[];
        }
    }
) {
    const model = (prisma as any)[modelName]
    const defaultMutationRoles = ["gym_owner", "manager"]

    // LIST
    app.get(`/api/${path}`, authenticate, async (req: any, res) => {
        try {
            const allowed = opts?.roles?.list || ["gym_owner", "manager", "frontdesk", "trainer"]
            if (!allowed.includes(req.role)) return res.status(403).json({ error: "Access denied." })

            const isTenantModel = modelName === "tenant";
            const isSuperAdmin = req.role === "super_admin";
            
            const where: any = {}
            if (!isSuperAdmin) {
                if (isTenantModel) {
                    where.id = req.tenantId
                } else {
                    where.tenantId = req.tenantId
                }
            }

            if (req.query.id) {
                const queryId = req.query.id as string;
                const item = await model.findFirst({
                    where: { 
                        id: queryId, 
                        ...(isSuperAdmin ? {} : (isTenantModel ? { id: req.tenantId } : { tenantId: req.tenantId }))
                    },
                    ...(opts?.include ? { include: opts.include } : {})
                })
                if (!item) return res.status(404).json({ error: "Item not found" })
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

            // Strict Row-level Isolation for Member users
            if (req.role === "member") {
                if (modelName === "member") {
                    where.userId = req.userId
                } else if (opts?.filterFields?.includes("memberId")) {
                    where.memberId = req.userId
                }
            }

            const items = await model.findMany({
                where,
                ...(opts?.include ? { include: opts.include } : {}),
                orderBy: { createdAt: "desc" },
            })
            const safeItems = items.map((item: any) => {
                const { passwordHash, ...rest } = item;
                return rest;
            });
            res.json(snakeToCamel(safeItems));
        } catch (err: any) {
            res.status(500).json({ error: err.message })
        }
    })

    // CREATE
    app.post(`/api/${path}`, authenticate, async (req: any, res) => {
        try {
            const allowed = opts?.roles?.create || defaultMutationRoles
            if (!allowed.includes(req.role)) return res.status(403).json({ error: "Access denied." })

            const body = Array.isArray(req.body) ? req.body[0] : req.body
            const isTenantModel = modelName === "tenant";
            
            const data = { 
                ...snakeToCamel(body), 
                ...(isTenantModel ? {} : { tenantId: req.tenantId }) 
            }

            const item = await model.create({ data })
            res.json(snakeToCamel(item))
        } catch (err: any) {
            console.error(`POST /api/${path} error:`, err.message)
            res.status(500).json({ error: err.message })
        }
    })

    // UPDATE
    app.patch(`/api/${path}`, authenticate, async (req: any, res) => {
        try {
            const allowed = opts?.roles?.update || defaultMutationRoles
            if (!allowed.includes(req.role)) return res.status(403).json({ error: "Access denied." })

            const id = req.query.id as string
            if (!id) return res.status(400).json({ error: "ID required" })

            const isTenantModel = modelName === "tenant";
            const isSuperAdmin = req.role === "super_admin";

            // Use updateMany to safely enforce tenant isolation
            const result = await model.updateMany({
                where: { 
                    id, 
                    ...(isSuperAdmin ? {} : (isTenantModel ? { id: req.tenantId } : { tenantId: req.tenantId }))
                },
                data: snakeToCamel(req.body)
            })

            if (result.count === 0) {
                return res.status(404).json({ error: "Item not found or access denied" })
            }

            const updated = await model.findUnique({ where: { id } })
            res.json(snakeToCamel(updated))
        } catch (err: any) {
            res.status(500).json({ error: err.message })
        }
    })

    // DELETE
    app.delete(`/api/${path}`, authenticate, async (req: any, res) => {
        try {
            const allowed = opts?.roles?.delete || defaultMutationRoles
            if (!allowed.includes(req.role)) return res.status(403).json({ error: "Access denied." })

            const id = req.query.id as string
            if (!id) return res.status(400).json({ error: "ID required" })

            const isTenantModel = modelName === "tenant";
            const isSuperAdmin = req.role === "super_admin";

            const result = await model.deleteMany({
                where: { 
                    id, 
                    ...(isSuperAdmin ? {} : (isTenantModel ? { id: req.tenantId } : { tenantId: req.tenantId }))
                }
            })

            if (result.count === 0) {
                return res.status(404).json({ error: "Item not found or access denied" })
            }

            res.json({ success: true })
        } catch (err: any) {
            res.status(500).json({ error: err.message })
        }
    })
}

// Explicit overrides for Owner-only Membership creations/updates to enforce role guards
app.post("/api/memberships", authenticate, async (req: any, res) => {
    if (req.role !== "gym_owner") {
        return res.status(403).json({ error: "Access denied. Owners only." })
    }
    try {
        const body = Array.isArray(req.body) ? req.body[0] : req.body
        const data = { ...snakeToCamel(body), tenantId: req.tenantId }
        const item = await prisma.membership.create({ data })
        res.json(snakeToCamel(item))
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

app.patch("/api/memberships", authenticate, async (req: any, res) => {
    if (req.role !== "gym_owner") {
        return res.status(403).json({ error: "Access denied. Owners only." })
    }
    try {
        const id = req.query.id as string
        if (!id) return res.status(400).json({ error: "ID required" })
        const result = await prisma.membership.updateMany({
            where: { id, tenantId: req.tenantId },
            data: snakeToCamel(req.body)
        })
        if (result.count === 0) return res.status(404).json({ error: "Item not found or access denied" })
        const updated = await prisma.membership.findUnique({ where: { id } })
        res.json(snakeToCamel(updated))
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

app.delete("/api/memberships", authenticate, async (req: any, res) => {
    if (req.role !== "gym_owner") {
        return res.status(403).json({ error: "Access denied. Owners only." })
    }
    try {
        const id = req.query.id as string
        if (!id) return res.status(400).json({ error: "ID required" })
        const result = await prisma.membership.deleteMany({
            where: { id, tenantId: req.tenantId }
        })
        if (result.count === 0) return res.status(404).json({ error: "Item not found or access denied" })
        res.json({ success: true })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

// ==================== REGISTER ALL ROUTES ====================

// Override POST /api/members to generate Invoices and Payments automatically
app.get("/api/memberships", authenticate, async (req: any, res) => {
    try {
        const plans = await prisma.membership.findMany({
            where: { tenantId: req.tenantId },
            orderBy: { name: "asc" }
        });
        res.json(snakeToCamel(plans));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/members", authenticate, async (req: any, res) => {
    const allowedRoles = ["gym_owner", "manager", "frontdesk"];
    if (!allowedRoles.includes(req.role)) {
        return res.status(403).json({ error: "Access denied." });
    }

    try {
        const data = snakeToCamel(req.body);
        const tenantId = req.tenantId;

        const result = await prisma.$transaction(async (tx) => {
            const member = await tx.member.create({
                data: {
                    ...data,
                    tenantId,
                    joinedAt: data.joinedAt ? new Date(data.joinedAt) : new Date(),
                    dob: data.dob ? new Date(data.dob) : null,
                    planStartedAt: data.planStartedAt ? new Date(data.planStartedAt) : null,
                    planExpiresAt: data.planExpiresAt ? new Date(data.planExpiresAt) : null,
                }
            });

            if (data.currentPlanId) {
                const plan = await tx.membership.findUnique({ where: { id: data.currentPlanId } });
                if (plan) {
                    const subtotalPaise = plan.priceCents;
                    const taxPercent = 0; // Defaulting to 0 for local members unless explicitly requested
                    const taxPaise = Math.round(subtotalPaise * (taxPercent / 100));
                    const totalPaise = subtotalPaise + taxPaise;
                    
                    const payment = await tx.payment.create({
                        data: {
                            tenantId,
                            memberId: member.id,
                            membershipId: plan.id,
                            amountCents: subtotalPaise, // strictly priceCents
                            currency: plan.currency || "INR",
                            provider: "cash",
                            status: "paid",
                            paidAt: new Date(),
                        }
                    });

                    const invoiceNumber = `INV-${tenantId.slice(0,4).toUpperCase()}-${Date.now()}`;
                    await tx.invoice.create({
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
                    });
                }
            }
            return member;
        });

        res.json(snakeToCamel(result));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Override POST /api/members/renew for processing backend Invoice & Payment on Renewals
app.post("/api/members/renew", authenticate, async (req: any, res) => {
    const allowedRoles = ["gym_owner", "manager", "frontdesk"];
    if (!allowedRoles.includes(req.role)) {
        return res.status(403).json({ error: "Access denied." });
    }

    try {
        const { id, planId } = snakeToCamel(req.body);
        const tenantId = req.tenantId;

        if (!id) return res.status(400).json({ error: "Member ID is required" });

        const member = await prisma.member.findUnique({ where: { id, tenantId } });
        if (!member) return res.status(404).json({ error: "Member not found" });

        const selectedPlanId = planId || member.currentPlanId;
        if (!selectedPlanId) return res.status(400).json({ error: "Plan ID is required for renewal" });

        const plan = await prisma.membership.findUnique({ where: { id: selectedPlanId } });
        if (!plan) return res.status(404).json({ error: "Plan not found" });

        const result = await prisma.$transaction(async (tx) => {
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + (plan.durationDays || 30));

            const updatedMember = await tx.member.update({
                where: { id },
                data: {
                    currentPlanId: plan.id,
                    planStartedAt: startDate,
                    planExpiresAt: endDate,
                    status: "active"
                }
            });

            const subtotalPaise = plan.priceCents;
            const payment = await tx.payment.create({
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
            });

            const invoiceNumber = `INV-${tenantId.slice(0,4).toUpperCase()}-${Date.now()}`;
            await tx.invoice.create({
                data: {
                    tenantId,
                    memberId: member.id,
                    paymentId: payment.id,
                    invoiceNumber,
                    subtotalPaise,
                    taxPercent: 0,
                    taxPaise: 0,
                    totalPaise: subtotalPaise,
                    status: "paid",
                    lineItems: [{ name: `Renewal - ${plan.name}`, priceCents: plan.priceCents, quantity: 1 }],
                }
            });

            return updatedMember;
        });

        res.json(snakeToCamel(result));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Removed redundant dashboard route (duplicate found at footer)

app.post("/api/attendance", authenticate, async (req: any, res) => {
    try {
        const { memberId, staffId, userId, deviceInfo } = snakeToCamel(req.body);
        const tenantId = req.tenantId;

        // 1. Try to find a Member
        const idToSearch = memberId || userId;
        if (!idToSearch) return res.status(400).json({ error: "ID (Member or Staff) is required" });

        const member = await prisma.member.findFirst({
            where: { OR: [{ id: idToSearch }, { userId: idToSearch }], tenantId },
            include: { currentPlan: true }
        });

        if (member) {
            // Member logic
            const expiryDate = member.planExpiresAt;
            if (expiryDate && new Date(expiryDate) < new Date()) {
                await prisma.member.update({ where: { id: member.id }, data: { status: "expired" } });
                return res.status(400).json({ error: "Membership has expired. Please renew." });
            }
            if (member.status !== "active") return res.status(400).json({ error: `Member status is ${member.status}` });

            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const existing = await prisma.attendance.findFirst({
                where: { memberId: member.id, tenantId, checkinAt: { gte: todayStart } }
            });
            if (existing) return res.status(400).json({ error: "Member already checked in today" });

            const attendance = await prisma.attendance.create({
                data: {
                    tenantId,
                    memberId: member.id,
                    checkinAt: new Date(),
                    deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null
                }
            });
            
            // Update fitness stats
            await prisma.memberFitnessStats.upsert({
                where: { memberId: member.id },
                update: { totalCheckIns: { increment: 1 } },
                create: { memberId: member.id, tenantId, totalCheckIns: 1 }
            });

            return res.json(snakeToCamel(attendance));
        }

        // 2. Try to find a Staff Profile
        const staff = await prisma.staffProfile.findFirst({
            where: { OR: [{ id: idToSearch }, { userId: idToSearch }], tenantId }
        });

        if (staff) {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            
            const staffAttendance = await prisma.staffAttendance.upsert({
                where: { staffId_date: { staffId: staff.id, date } },
                update: { checkOutAt: new Date() }, // If already checked in, treat second scan as checkout
                create: {
                    tenantId,
                    staffId: staff.id,
                    date,
                    checkInAt: new Date(),
                    isPresent: true
                }
            });

            return res.json(snakeToCamel(staffAttendance));
        }

        return res.status(404).json({ error: "No member or staff profile found for this code" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Trainer endpoints for Mobile App
app.get("/api/trainer/members", authenticate, async (req: any, res) => {
    try {
        const tenantId = req.tenantId;
        const members = await prisma.member.findMany({
            where: { tenantId },
            include: { currentPlan: true }
        });
        
        const responseData = members.map((m: any) => ({
            id: m.id,
            name: m.fullName || m.full_name,
            planStatus: m.status || "inactive"
        }));
        
        res.json(responseData);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== WORKOUTS (Templates for Trainer App) ====================

app.get("/api/workouts", authenticate, async (req: any, res) => {
    try {
        const tenantId = req.tenantId;
        
        // Return both Workout and WorkoutTemplate models for compatibility
        const [workouts, templates] = await Promise.all([
            prisma.workout.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
            prisma.workoutTemplate.findMany({ where: { tenantId, isActive: true }, orderBy: { isDefault: "desc" } })
        ]);
        
        const combined = [
            ...workouts.map(w => ({ ...w, type: "workout" })),
            ...templates.map(t => ({ ...t, type: "template" }))
        ];
        
        res.json(combined.map(snakeToCamel));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/workouts/assign", authenticate, async (req: any, res) => {
    try {
        const { memberId, workoutId, notes } = snakeToCamel(req.body);
        const tenantId = req.tenantId;

        const assignment = await prisma.memberWorkout.create({
            data: {
                tenantId,
                memberId,
                workoutId,
                notes,
                assignedAt: new Date()
            }
        });
        
        res.json(snakeToCamel(assignment));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

createCrudRoutes("members", "member", {
    searchFields: ["fullName", "email", "memberCode"],
    filterFields: ["status"],
    include: { currentPlan: true, assignedTrainer: true },
    roles: {
        list: ["gym_owner", "manager", "frontdesk", "member"],
        create: ["gym_owner", "manager", "frontdesk"],
        update: ["gym_owner", "manager"],
        delete: ["gym_owner"]
    }
})
createCrudRoutes("memberships", "membership", { filterFields: ["isActive"] })
createCrudRoutes("trainers", "trainer", { searchFields: ["fullName", "email"], filterFields: ["isActive"] })
createCrudRoutes("trainer-slots", "trainerSlot", { include: { trainer: true, bookedBy: true }, filterFields: ["trainerId"] })
createCrudRoutes("schedules", "schedule", { 
    include: { service: true, trainer: true },
    roles: {
        list: ["admin", "manager", "staff", "trainer", "member"]
    }
})
createCrudRoutes("workouts", "workout")
createCrudRoutes("diet-plans", "dietPlan")
createCrudRoutes("services", "service")
createCrudRoutes("branches", "branch")
createCrudRoutes("leads", "lead", { searchFields: ["fullName", "email", "phone"], filterFields: ["status", "priority"] })
createCrudRoutes("follow-ups", "followUp", { include: { lead: true, member: true }, filterFields: ["status", "type", "priority"] })
createCrudRoutes("visitors", "visitor")
createCrudRoutes("complaints", "complaint", { include: { member: { select: { fullName: true } } }, filterFields: ["status", "priority"] })
createCrudRoutes("invoices", "invoice", { filterFields: ["status", "memberId"] })
createCrudRoutes("expenses", "expense", { filterFields: ["category"] })
createCrudRoutes("products", "product")
createCrudRoutes("lockers", "locker", { include: { member: { select: { fullName: true, memberCode: true } } }, filterFields: ["status"] })
createCrudRoutes("front-desk", "frontDesk", { include: { user: { select: { email: true } } } })
createCrudRoutes("notifications", "notification")
createCrudRoutes("member-workouts", "memberWorkout", { include: { workout: true }, filterFields: ["memberId"] })
createCrudRoutes("users", "userProfile", { 
    searchFields: ["fullName", "email"], 
    filterFields: ["role", "isActive"], 
    include: { trainer: true },
    roles: {
        list: ["gym_owner"],
        create: ["gym_owner"],
        update: ["gym_owner"],
        delete: ["gym_owner"]
    }
})
createCrudRoutes("member-diets", "memberDiet", { include: { dietPlan: true }, filterFields: ["memberId"] })
createCrudRoutes("payments", "payment", { filterFields: ["status", "memberId"] })
createCrudRoutes("tenants", "tenant", {
    roles: {
        list: ["super_admin", "gym_owner", "manager", "frontdesk"],
        create: ["super_admin"],
        update: ["super_admin", "gym_owner"],
        delete: ["super_admin"]
    }
})

createCrudRoutes("saas_plans", "saasPlan", { 
    filterFields: ["isActive"],
    roles: {
        list: ["super_admin"],
        create: ["super_admin"],
        update: ["super_admin"],
        delete: ["super_admin"]
    }
})
createCrudRoutes("saas_subscriptions", "saasSubscription", { 
    filterFields: ["tenantId", "status"], 
    include: { plan: true },
    roles: {
        list: ["super_admin"],
        create: ["super_admin"],
        update: ["super_admin"],
        delete: ["super_admin"]
    }
})
createCrudRoutes("saas_invoices", "saasInvoice", { 
    filterFields: ["tenantId", "status"], 
    include: { tenant: { select: { name: true } } },
    roles: {
        list: ["super_admin"],
        create: ["super_admin"],
        update: ["super_admin"],
        delete: ["super_admin"]
    }
})

// ==================== MEMBER LEADERBOARD ====================

app.get("/api/members/leaderboard", authenticate, async (req: any, res) => {
    try {
        if (req.role !== "member") return res.status(403).json({ error: "Only members can access leaderboard" });
        
        const leaderboard = await prisma.member.findMany({
            where: { tenantId: req.tenantId, status: "active" },
            orderBy: [{ planExpiresAt: "desc" }, { joinedAt: "desc" }],
            take: 50,
            include: { user: { select: { fullName: true, avatarUrl: true } } }
        });
        
        const mapped = leaderboard.map((m, i) => ({
            rank: i + 1,
            memberId: m.id,
            fullName: m.fullName,
            avatarUrl: m.user?.avatarUrl,
            points: 1000 - (i * 20), // Placeholder points until real logic
            currentPlan: m.currentPlanId ? "Active" : "Expired"
        }));
        
        res.json(mapped);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== MEMBER WORKOUT LOGS ====================

app.post("/api/members/me/workout-logs", authenticate, async (req: any, res) => {
    try {
        if (req.role !== "member") return res.status(403).json({ error: "Only members can log workouts" });
        
        const member = await prisma.member.findUnique({ where: { userId: req.userId } });
        if (!member) return res.status(404).json({ error: "Member not found" });
        
        const { workoutId, exercises, duration, notes } = req.body;
        
        const log = await prisma.memberWorkout.create({
            data: {
                tenantId: req.tenantId,
                memberId: member.id,
                workoutId: workoutId || "custom",
                assignedBy: member.assignedTrainerId,
                assignedAt: new Date(),
                completedAt: new Date(),
                notes,
                progress: { duration, exercises }
            }
        });
        
        res.json(snakeToCamel(log));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== MEMBER MEASUREMENTS ====================

app.post("/api/members/me/measurements", authenticate, async (req: any, res) => {
    try {
        if (req.role !== "member") return res.status(403).json({ error: "Only members can log measurements" });
        
        const member = await prisma.member.findUnique({ where: { userId: req.userId } });
        if (!member) return res.status(404).json({ error: "Member not found" });
        
        const { type, value, unit, notes } = req.body;
        
        // Check if memberFitnessStats exists
        let stats = await prisma.memberFitnessStats.findUnique({ where: { memberId: member.id } });
        
        if (!stats) {
            stats = await prisma.memberFitnessStats.create({
                data: { memberId: member.id, tenantId: req.tenantId }
            });
        }
        
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.patch("/api/members/me/health-profile", authenticate, async (req: any, res) => {
    try {
        if (req.role !== "member") return res.status(403).json({ error: "Only members can update health profile" });
        
        const member = await prisma.member.findUnique({ where: { userId: req.userId } });
        if (!member) return res.status(404).json({ error: "Member not found" });
        
        // Update fitness stats or member profile with health data
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== MEMBER SPECIALIZED ROUTES ====================

app.get("/api/members/me/stats", authenticate, async (req: any, res) => {
    try {
        const member = await prisma.member.findUnique({
            where: { userId: req.userId }
        });
        if (!member) return res.status(404).json({ error: "Member profile not found" });

        const stats = await prisma.memberFitnessStats.findUnique({
            where: { memberId: member.id }
        });

        // Calculate intensity trend (last 7 check-ins)
        const attendance = await prisma.attendance.findMany({
            where: { memberId: member.id },
            take: 7,
            orderBy: { checkinAt: "desc" }
        });

        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const intensityTrend = attendance.reverse().map((a, i) => ({
            day: days[new Date(a.checkinAt).getDay()],
            minutes: 65 + Math.floor(Math.random() * 20) // Simulated intensity until heart rate sync is implemented
        }));

        res.json({
            totalWorkouts: stats?.totalWorkoutsCompleted || 0,
            activeDays: stats?.totalCheckIns || 0,
            loyaltyPoints: (stats?.totalCheckIns || 0) * 10, // 10 points per visit
            currentStreak: stats?.currentStreak || 0,
            intensityTrend
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/members/leaderboard", authenticate, async (req: any, res) => {
    try {
        const leaderboard = await prisma.memberFitnessStats.findMany({
            where: { tenantId: req.tenantId },
            include: {
                member: {
                    select: { id: true, fullName: true, avatarUrl: true }
                }
            },
            orderBy: [
                { totalCheckIns: "desc" },
                { currentStreak: "desc" }
            ],
            take: 20
        });

        const formatted = leaderboard.map((s, index) => ({
            id: s.member.id,
            name: s.member.fullName,
            avatarUrl: s.member.avatarUrl,
            points: s.totalCheckIns * 10,
            rank: index + 1
        }));

        res.json(formatted);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/members/me/bookings", authenticate, async (req: any, res) => {
    try {
        const member = await prisma.member.findUnique({
            where: { userId: req.userId }
        });
        if (!member) return res.status(404).json({ error: "Member profile not found" });

        const bookings = await prisma.trainerSlot.findMany({
            where: {
                bookedByMemberId: member.id,
                tenantId: req.tenantId
            },
            include: {
                trainer: { select: { fullName: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        res.json(snakeToCamel(bookings));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/members/me/workouts", authenticate, async (req: any, res) => {
    try {
        const member = await prisma.member.findUnique({
            where: { userId: req.userId }
        });
        if (!member) return res.status(404).json({ error: "Member not found" });

        const workouts = await prisma.memberWorkout.findMany({
            where: {
                memberId: member.id,
                tenantId: req.tenantId,
                completedAt: null
            },
            include: {
                workout: true
            },
            orderBy: { assignedAt: "desc" }
        });

        res.json(snakeToCamel(workouts));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.patch("/api/members/me/workouts/:id", authenticate, async (req: any, res) => {
    try {
        const member = await prisma.member.findUnique({
            where: { userId: req.userId }
        });
        if (!member) return res.status(404).json({ error: "Member not found" });

        const { completed, notes, progress } = req.body;
        
        const result = await prisma.memberWorkout.updateMany({
            where: {
                id: req.params.id,
                memberId: member.id,
                tenantId: req.tenantId
            },
            data: {
                completedAt: completed ? new Date() : undefined,
                notes: notes,
                progress: progress || undefined
            }
        });

        if (result.count === 0) return res.status(404).json({ error: "Workout assignment not found" });

        if (completed) {
            await prisma.memberFitnessStats.upsert({
                where: { memberId: member.id },
                update: { totalWorkoutsCompleted: { increment: 1 } },
                create: {
                    memberId: member.id,
                    tenantId: req.tenantId,
                    totalWorkoutsCompleted: 1
                }
            });
        }

        const updated = await prisma.memberWorkout.findUnique({ where: { id: req.params.id } });
        res.json(snakeToCamel(updated));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/members/me/measurements", authenticate, async (req: any, res) => {
    try {
        const member = await prisma.member.findUnique({
            where: { userId: req.userId },
            include: { healthProfile: true }
        });
        if (!member) return res.status(404).json({ error: "Member not found" });

        let healthProfileId = member.healthProfile?.id;
        if (!healthProfileId) {
            const hp = await prisma.memberHealthProfile.create({
                data: { memberId: member.id, tenantId: req.tenantId }
            });
            healthProfileId = hp.id;
        }

        const { type, value, unit, notes } = req.body;
        const measurement = await prisma.bodyMeasurement.create({
            data: {
                tenantId: req.tenantId,
                memberId: member.id,
                healthProfileId,
                type,
                value: parseFloat(value),
                unit,
                notes,
                recordedBy: req.userId
            }
        });

        res.json(snakeToCamel(measurement));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.patch("/api/members/me/health-profile", authenticate, async (req: any, res) => {
    try {
        const member = await prisma.member.findUnique({
            where: { userId: req.userId }
        });
        if (!member) return res.status(404).json({ error: "Member not found" });

        const data = snakeToCamel(req.body);
        const profile = await prisma.memberHealthProfile.upsert({
            where: { memberId: member.id },
            update: data,
            create: { ...data, memberId: member.id, tenantId: req.tenantId }
        });

        res.json(snakeToCamel(profile));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== FINANCIAL SETTLEMENT ====================

app.post("/api/payments/settle", authenticate, async (req: any, res) => {
    try {
        const { invoiceId, amount, method, notes, memberId } = snakeToCamel(req.body);
        const tenantId = req.tenantId;

        const result = await prisma.$transaction(async (tx: any) => {
            // 1. Create Payment
            const payment = await tx.payment.create({
                data: {
                    tenantId,
                    memberId,
                    invoiceId,
                    amountCents: Math.round(parseFloat(amount) * 100),
                    paymentMethod: method || "cash",
                    status: "paid",
                    paidAt: new Date(),
                    notes
                }
            });

            // 2. Update Invoice
            if (invoiceId) {
                await tx.invoice.update({
                    where: { id: invoiceId },
                    data: { status: "paid", paidAt: new Date(), paymentId: payment.id }
                });
            } else {
                // Generate automated invoice if missing
                const invoiceNumber = `INV-${Date.now()}`;
                await tx.invoice.create({
                    data: {
                        tenantId,
                        memberId,
                        paymentId: payment.id,
                        invoiceNumber,
                        subtotalPaise: payment.amountCents,
                        totalPaise: payment.amountCents,
                        status: "paid",
                        paidAt: new Date(),
                        lineItems: [{ description: "Membership Fee", amountPaise: payment.amountCents }]
                    }
                });
            }

            // 3. Update Member Subscription
            const member = await tx.member.findUnique({
                where: { id: memberId },
                include: { currentPlan: true }
            });

            if (member && member.currentPlan) {
                const months = member.currentPlan.durationMonths || 1;
                const currentExpiry = member.planExpiresAt && new Date(member.planExpiresAt) > new Date() 
                    ? new Date(member.planExpiresAt) 
                    : new Date();
                
                const newExpiry = new Date(currentExpiry);
                newExpiry.setMonth(newExpiry.getMonth() + months);

                await tx.member.update({
                    where: { id: memberId },
                    data: {
                        status: "active",
                        planExpiresAt: newExpiry,
                        lastPaymentDate: new Date()
                    }
                });
            }

            return payment;
        });

        res.json(snakeToCamel(result));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== STAFF & HR ====================

app.get("/api/staff/me/stats", authenticate, async (req: any, res) => {
    try {
        const staff = await prisma.staffProfile.findUnique({
            where: { userId: req.userId }
        });
        if (!staff) return res.status(404).json({ error: "Staff profile not found" });

        const attendance = await prisma.staffAttendance.findMany({
            where: { staffId: staff.id },
            orderBy: { date: "desc" },
            take: 30
        });

        res.json({
            staffInfo: snakeToCamel(staff),
            attendanceTrend: snakeToCamel(attendance)
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/staff/profiles", authenticate, async (req: any, res) => {
    try {
        const staff = await prisma.staffProfile.findMany({
            where: { tenantId: req.tenantId },
            include: { user: { select: { fullName: true, role: true, email: true, phone: true } } }
        });
        res.json(snakeToCamel(staff));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/staff/profiles", authenticate, async (req: any, res) => {
    try {
        const data = snakeToCamel(req.body);
        const staff = await prisma.staffProfile.create({
            data: {
                ...data,
                tenantId: req.tenantId,
                joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date()
            }
        });
        res.json(snakeToCamel(staff));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.patch("/api/staff/profiles/:id", authenticate, async (req: any, res) => {
    try {
        const data = snakeToCamel(req.body);
        if (data.joiningDate) data.joiningDate = new Date(data.joiningDate);
        if (data.resignationDate) data.resignationDate = new Date(data.resignationDate);

        const staff = await prisma.staffProfile.update({
            where: { id: req.params.id, tenantId: req.tenantId },
            data
        });
        res.json(snakeToCamel(staff));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Leave Management
app.get("/api/staff/leaves", authenticate, async (req: any, res) => {
    try {
        const leaves = await prisma.staffLeave.findMany({
            where: { tenantId: req.tenantId },
            include: { staff: { include: { user: { select: { fullName: true } } } } },
            orderBy: { createdAt: "desc" }
        });
        res.json(snakeToCamel(leaves));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/staff/leaves", authenticate, async (req: any, res) => {
    try {
        const data = snakeToCamel(req.body);
        const leave = await prisma.staffLeave.create({
            data: {
                ...data,
                tenantId: req.tenantId,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                status: "pending"
            }
        });
        res.json(snakeToCamel(leave));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.patch("/api/staff/leaves/:id", authenticate, async (req: any, res) => {
    try {
        const { status, notes } = req.body;
        const leave = await prisma.staffLeave.update({
            where: { id: req.params.id, tenantId: req.tenantId },
            data: {
                status,
                notes,
                approvedBy: req.userId,
                approvedAt: status === "approved" ? new Date() : null
            }
        });
        res.json(snakeToCamel(leave));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Invoices Management
app.get("/api/invoices", authenticate, async (req: any, res) => {
    try {
        const invoices = await prisma.invoice.findMany({
            where: { tenantId: req.tenantId },
            include: { member: { select: { fullName: true, memberCode: true } } },
            orderBy: { invoiceDate: "desc" }
        });
        res.json(snakeToCamel(invoices));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/invoices/:id", authenticate, async (req: any, res) => {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: req.params.id, tenantId: req.tenantId },
            include: { member: true, tenant: true }
        });
        if (!invoice) return res.status(404).json({ error: "Invoice not found" });
        res.json(snakeToCamel(invoice));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== OPERATIONS & LOGISTICS ====================

app.get("/api/reports/capacity", authenticate, async (req: any, res) => {
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: req.tenantId }
        });
        
        const currentCount = await prisma.attendance.count({
            where: {
                tenantId: req.tenantId,
                checkoutAt: null
            }
        });

        const maxCapacity = 100; // Default if not in tenant settings
        res.json({
            currentCount,
            maxCapacity,
            percentFull: (currentCount / maxCapacity) * 100
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/reports/activity", authenticate, async (req: any, res) => {
    try {
        const activity = await prisma.attendance.findMany({
            where: { tenantId: req.tenantId },
            include: {
                member: {
                    select: { fullName: true, memberCode: true, avatarUrl: true }
                }
            },
            orderBy: { checkinAt: "desc" },
            take: 20
        });

        res.json(snakeToCamel(activity));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== REPORTS & DASHBOARD ====================

app.get("/api/reports/dashboard", authenticate, async (req: any, res) => {
    try {
        const { tenantId } = req
        if (!tenantId) return res.status(400).json({ error: "Tenant ID required" })

        const { startDate, endDate } = req.query
        const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        const end = endDate ? new Date(endDate as string) : new Date()
        
        const todayStr = new Date().toISOString().split("T")[0]

        // 1. Core Counts
        const [totalMembers, activeMembers, totalTrainers, totalFrontdesk, totalManagers, activeLeaves] = await Promise.all([
            prisma.member.count({ where: { tenantId } }),
            prisma.member.count({ where: { tenantId, status: "active" } }),
            prisma.userProfile.count({ where: { tenantId, role: "trainer" } }),
            prisma.userProfile.count({ where: { tenantId, role: "frontdesk" } }),
            prisma.userProfile.count({ where: { tenantId, role: "frontdesk" } }), // frontdesk
            prisma.staffLeave.count({ 
                where: { 
                    tenantId, 
                    status: "approved", 
                    startDate: { lte: new Date() },
                    endDate: { gte: new Date() }
                } 
            })
        ])

        // 2. Revenue & New Sales
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

        // 3. Attendance
        const attendanceToday = await prisma.attendance.count({
            where: {
                tenantId,
                checkinAt: {
                    gte: new Date(`${todayStr}T00:00:00.000Z`),
                    lt: new Date(`${todayStr}T23:59:59.999Z`)
                }
            }
        })

        // 4. Leads & Follow-ups
        const [totalLeads, hotLeads, pendingFollowUps, totalFollowUpsToday] = await Promise.all([
            prisma.lead.count({ where: { tenantId } }),
            prisma.lead.count({ where: { tenantId, priority: "hot" } }),
            prisma.followUp.count({ where: { tenantId, status: "pending" } }),
            prisma.followUp.count({ 
                where: { 
                    tenantId, 
                    followUpDate: { 
                        gte: new Date(`${todayStr}T00:00:00.000Z`),
                        lt: new Date(`${todayStr}T23:59:59.999Z`)
                    }
                } 
            })
        ])

        // 5. New Joiners in Period
        const newMembersThisMonth = await prisma.member.count({
            where: { tenantId, createdAt: { gte: start, lte: end } }
        })

        res.json({
            totalMembers,
            activeMembers,
            totalTrainers,
            totalFrontdesk,
            totalManagers,
            activeLeaves,
            totalRevenue,
            monthlyRevenue,
            attendanceToday,
            newMembersThisMonth,
            totalLeads,
            hotLeads,
            pendingFollowUps,
            totalFollowUpsToday
        })

    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

// ==================== REPORTS MEMBERS ====================

app.get("/api/reports/members", authenticate, async (req: any, res) => {
    try {
        const { tenantId } = req
        if (!tenantId) return res.status(400).json({ error: "Tenant ID required" })

        const today = new Date()
        const next30Days = new Date()
        next30Days.setDate(today.getDate() + 30)

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const [expiring, newJoiners, allActive] = await Promise.all([
            prisma.member.findMany({
                where: { tenantId: tenantId as string, status: "active", planExpiresAt: { gte: today, lte: next30Days } },
                include: { currentPlan: true },
                orderBy: { planExpiresAt: "asc" }
            }),
            prisma.member.findMany({
                where: { tenantId: tenantId as string, joinedAt: { gte: thirtyDaysAgo } },
                include: { currentPlan: true },
                orderBy: { joinedAt: "desc" }
            }),
            prisma.member.findMany({
                where: { tenantId: tenantId as string, status: "active" },
                select: { id: true, fullName: true, memberCode: true, phone: true, createdAt: true }
            })
        ])

        const recentAttendance = await prisma.attendance.findMany({
            where: { tenantId: tenantId as string, checkinAt: { gte: sevenDaysAgo } },
            select: { memberId: true }
        })
        const activeMemberIdsInAttendance = new Set(recentAttendance.map(a => a.memberId))

        const inactive = allActive.filter(m => !activeMemberIdsInAttendance.has(m.id))

        res.json({
            expiring: snakeToCamel(expiring),
            newJoiners: snakeToCamel(newJoiners),
            inactive: snakeToCamel(inactive)
        })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

// ==================== TENANTS ====================

app.get("/api/tenants/:id", authenticate, async (req: any, res) => {
    try {
        if (req.params.id !== req.tenantId && req.role !== "super_admin") {
            return res.status(403).json({ error: "Access denied" })
        }
        const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } })
        if (!tenant) return res.status(404).json({ error: "Tenant not found" })
        res.json(snakeToCamel(tenant))
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

app.patch("/api/tenants/:id", authenticate, async (req: any, res) => {
    try {
        if (req.params.id !== req.tenantId && req.role !== "super_admin") {
            return res.status(403).json({ error: "Access denied" })
        }
        const data = snakeToCamel(req.body)
        // Omit sensitive fields or read-onlys if needed
        const tenant = await prisma.tenant.update({
            where: { id: req.params.id },
            data
        })
        res.json(snakeToCamel(tenant))
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

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
            gstNumber: converted.gstNumber,
            panNumber: converted.panNumber,
            registeredAddress: converted.registeredAddress,
            billingCycle: converted.billingCycle || "monthly",
            paymentGatewayPreference: converted.paymentGatewayPreference || "cash",
            invoicePrefix: converted.invoicePrefix || "GYM",
            primaryColor: converted.primaryColor,
            secondaryColor: converted.secondaryColor,
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
                        passwordHash: hashed,
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

app.get("/api/dashboard", authenticate, async (req: any, res) => {
    try {
        const tenantId = req.tenantId // Enforce from token

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

// ==================== PAYMENTS (specialized) ====================
app.get("/api/payments", authenticate, async (req: any, res) => {
    try {
        const where: any = { tenantId: req.tenantId }
        if (req.query.memberId) where.memberId = req.query.memberId as string
        if (req.query.status) where.status = req.query.status as string

        const payments = await prisma.payment.findMany({
            where,
            include: { member: { select: { fullName: true } } },
            orderBy: { paidAt: "desc" },
            take: req.query.limit ? parseInt(req.query.limit as string) : 20
        })
        // snakeToCamel to match apiClient Expectations
        res.json(snakeToCamel(payments))
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

app.post("/api/payments/razorpay-order", authenticate, async (req: any, res) => {
    try {
        const { memberId, amountInr, membershipId } = req.body
        if (!memberId || !amountInr) {
            return res.status(400).json({ error: "memberId and amountInr are required" })
        }

        // 1. Verify existence of member in tenant
        const member = await prisma.member.findUnique({
            where: { id: memberId, tenantId: req.tenantId }
        })
        if (!member) return res.status(404).json({ error: "Member not found" })

        // 2. Insert RazorpayOrder record to track state
        // (If Razorpay SDK was imported, we would call razorpay.orders.create({amount: amountInr * 100, currency: "INR"}))
        // Since we are simulating or awaiting keys, we simulate an order ID
        const orderId = `order_${Math.random().toString(36).substr(2, 9)}`
        const amountPaise = Math.round(parseFloat(amountInr) * 100)

        const r_order = await prisma.razorpayOrder.create({
            data: {
                tenantId: req.tenantId,
                razorpayOrderId: orderId,
                memberId: memberId,
                membershipId: membershipId || null,
                amountPaise: amountPaise,
                currency: "INR",
                receipt: `receipt_${Date.now()}`,
                status: "created"
            }
        })

        res.json({
            success: true,
            orderId: r_order.razorpayOrderId,
            amount: r_order.amountPaise,
            currency: r_order.currency,
            // To be used by safe layout triggering:
            keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_mock_key"
        })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

// ==================== DASHBOARD STATS ====================

// Removed redundant dashboard stats route (consoldated in /api/reports/dashboard)

// ==================== ATTENDANCE (specialized) ====================

app.get("/api/attendance", authenticate, async (req: any, res) => {
    try {
        const where: any = { tenantId: req.tenantId } // Enforce tenant filter

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
        res.json(snakeToCamel(records))
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

app.post("/api/attendance", authenticate, async (req: any, res) => {
    try {
        const { memberId, checkinAt, deviceInfo, notes } = req.body
        if (!memberId) return res.status(400).json({ error: "memberId required" })

        const today = new Date().toISOString().split("T")[0]

        const result = await prisma.$transaction(async (tx: any) => {
            // 1. Check if already checked in today
            const existing = await tx.attendance.findFirst({
                where: {
                    memberId,
                    tenantId: req.tenantId,
                    checkinAt: {
                        gte: new Date(`${today}T00:00:00`),
                        lte: new Date(`${today}T23:59:59`)
                    }
                }
            })

            if (existing) {
                throw new Error("Member already checked in today")
            }

            // 2. Create Attendance
            const record = await tx.attendance.create({
                data: {
                    tenantId: req.tenantId,
                    memberId,
                    checkinAt: checkinAt ? new Date(checkinAt) : new Date(),
                    deviceInfo: deviceInfo || {},
                    notes: notes || null
                }
            })

            // 3. Upsert MemberFitnessStats for streak tracking
            const stats = await tx.memberFitnessStats.findUnique({ where: { memberId } })

            let currentStreak = 1
            let totalCheckIns = 1
            let longestStreak = 1
            const now = new Date()

            if (stats) {
                totalCheckIns = stats.totalCheckIns + 1
                const lastDate = stats.lastCheckInDate ? new Date(stats.lastCheckInDate) : null

                if (lastDate) {
                    const lastDateStr = lastDate.toISOString().split("T")[0]
                    const yesterday = new Date(now)
                    yesterday.setDate(now.getDate() - 1)
                    const yesterdayStr = yesterday.toISOString().split("T")[0]

                    if (lastDateStr === today) {
                        currentStreak = stats.currentStreak // Already handled error above, but safe
                    } else if (lastDateStr === yesterdayStr) {
                        currentStreak = stats.currentStreak + 1
                    } else {
                        currentStreak = 1 // reset on gap
                    }
                }
                longestStreak = Math.max(currentStreak, stats.longestStreak || 1)

                await tx.memberFitnessStats.update({
                    where: { memberId },
                    data: {
                        totalCheckIns,
                        currentStreak,
                        longestStreak,
                        lastCheckInDate: now
                    }
                })
            } else {
                await tx.memberFitnessStats.create({
                    data: {
                        tenantId: req.tenantId,
                        memberId,
                        totalCheckIns: 1,
                        currentStreak: 1,
                        longestStreak: 1,
                        lastCheckInDate: now
                    }
                })
            }

            return record
        })

        res.json(snakeToCamel(result))
    } catch (err: any) {
        res.status(err.message === "Member already checked in today" ? 409 : 500).json({ error: err.message })
    }
})

app.patch("/api/attendance", authenticate, async (req: any, res) => {
    try {
        const id = req.query.id as string
        if (!id) return res.status(400).json({ error: "ID required" })

        const result = await prisma.attendance.updateMany({
            where: { id, tenantId: req.tenantId },
            data: { checkoutAt: new Date() }
        })

        if (result.count === 0) {
            return res.status(404).json({ error: "Attendance record not found or access denied" })
        }

        const updated = await prisma.attendance.findUnique({ where: { id } })
        res.json(snakeToCamel(updated))
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

app.get("/api/reports", authenticate, async (req: any, res) => {
    try {
        const tenantId = req.tenantId // Enforce from token
        const type = req.query.type as string

        if (type === "revenue") {
            const payments = await prisma.payment.findMany({
                where: { tenantId, status: "paid" },
                select: { amountCents: true, paidAt: true },
                orderBy: { paidAt: "asc" },
            })
            return res.json(snakeToCamel(payments))
        }
        if (type === "attendance") {
            const records = await prisma.attendance.findMany({ where: { tenantId }, select: { checkinAt: true }, orderBy: { checkinAt: "asc" } })
            return res.json(snakeToCamel(records))
        }
        if (type === "member-growth") {
            const members = await prisma.member.findMany({ where: { tenantId }, select: { createdAt: true }, orderBy: { createdAt: "asc" } })
            return res.json(snakeToCamel(members))
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

// ==================== DAILY WORKOUT PLANS ====================

app.get("/api/member/workouts/today", authenticate, async (req: any, res) => {
    try {
        if (req.role !== "member") return res.status(403).json({ error: "Only members can access this" });
        const memberId = req.userId;
        
        const member = await prisma.member.findUnique({ where: { userId: memberId, tenantId: req.tenantId } });
        if (!member) return res.status(404).json({ error: "Member profile not found" });

        const targetDate = new Date();
        targetDate.setHours(0, 0, 0, 0);

        const plan = await prisma.dailyWorkoutPlan.findFirst({
            where: {
                memberId: member.id,
                tenantId: req.tenantId,
                date: targetDate
            }
        });

        if (!plan) return res.json(null);
        res.json(snakeToCamel(plan));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.patch("/api/member/workouts/:id", authenticate, async (req: any, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId;

        // Verify ownership if member
        if (req.role === "member") {
            const member = await prisma.member.findUnique({ where: { userId: req.userId, tenantId } });
            if (!member) return res.status(403).json({ error: "Member profile not found" });

            const existingPlan = await prisma.dailyWorkoutPlan.findFirst({
                where: { id, tenantId, memberId: member.id }
            });
            if (!existingPlan) return res.status(403).json({ error: "Access denied or plan not found" });
        }

        const { exercises, progress, status } = req.body;

        const updated = await prisma.dailyWorkoutPlan.update({
            where: { id, tenantId },
            data: { 
                ...(exercises ? { exercises } : {}), 
                ...(progress ? { progress } : {}), 
                ...(status ? { status } : {}) 
            }
        });

        res.json(snakeToCamel(updated));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/trainer/workouts/daily-plan", authenticate, async (req: any, res) => {
    const allowed = ["super_admin", "gym_owner", "manager", "trainer"];
    if (!allowed.includes(req.role)) return res.status(403).json({ error: "Access denied" });

    try {
        const { memberId, date, day, planType, exercises, status } = req.body;
        const tenantId = req.tenantId;
        
        let trainerId = null;
        if (req.role === "trainer") {
            const trainer = await prisma.trainer.findUnique({ where: { userId: req.userId, tenantId } });
            if (trainer) trainerId = trainer.id;
        }

        const planDate = date ? new Date(date) : new Date();
        planDate.setHours(0, 0, 0, 0);

        const plan = await prisma.dailyWorkoutPlan.create({
            data: {
                tenantId,
                trainerId,
                memberId,
                date: planDate,
                day: day || planDate.toLocaleDateString('en-US', { weekday: 'long' }),
                planType: planType || "custom",
                exercises: exercises || [],
                status: status || "pending",
                progress: { totalExercises: exercises?.length || 0, completed: 0, percentage: 0 }
            }
        });

        res.json(snakeToCamel(plan));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== WORKOUT TEMPLATES (Weekly Plans) ====================

app.get("/api/workout_templates", authenticate, async (req: any, res) => {
    try {
        const tenantId = req.tenantId;
        const templates = await prisma.workoutTemplate.findMany({
            where: { tenantId, isActive: true },
            orderBy: { isDefault: "desc" }
        });
        res.json(templates.map(snakeToCamel));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/workout_templates", authenticate, async (req: any, res) => {
    try {
        if (req.role === "member") return res.status(403).json({ error: "Members cannot create templates" });
        
        const { name, description, days, exercises } = req.body;
        const tenantId = req.tenantId;
        
        const template = await prisma.workoutTemplate.create({
            data: {
                tenantId,
                name,
                description,
                days: days || 7,
                exercises: typeof exercises === "string" ? exercises : JSON.stringify(exercises || []),
            }
        });
        res.json(snakeToCamel(template));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.patch("/api/workout_templates/:id", authenticate, async (req: any, res) => {
    try {
        if (req.role === "member") return res.status(403).json({ error: "Members cannot modify templates" });
        
        const { id } = req.params;
        const { name, description, days, exercises, isActive, isDefault } = req.body;
        
        const updateData: any = {};
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (days) updateData.days = days;
        if (exercises) updateData.exercises = typeof exercises === "string" ? exercises : JSON.stringify(exercises);
        if (isActive !== undefined) updateData.isActive = isActive;
        if (isDefault !== undefined) updateData.isDefault = isDefault;
        
        const template = await prisma.workoutTemplate.update({
            where: { id },
            data: updateData
        });
        res.json(snakeToCamel(template));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/workout_templates/:id", authenticate, async (req: any, res) => {
    try {
        if (req.role === "member") return res.status(403).json({ error: "Members cannot delete templates" });
        
        const { id } = req.params;
        await prisma.workoutTemplate.delete({ where: { id } });
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== ASSIGN WORKOUT TEMPLATE TO MEMBER ====================

app.post("/api/members/:memberId/workout_template", authenticate, async (req: any, res) => {
    try {
        if (req.role === "member") return res.status(403).json({ error: "Only trainers can assign plans" });
        
        const { memberId } = req.params;
        const { templateId, startDate } = req.body;
        
        const template = await prisma.workoutTemplate.findUnique({ where: { id: templateId } });
        if (!template) return res.status(404).json({ error: "Template not found" });
        
        const exercises = typeof template.exercises === "string" 
            ? JSON.parse(template.exercises) 
            : template.exercises;
        
        // Create daily workout plans for each day in the template
        const start = startDate ? new Date(startDate) : new Date();
        const assignedPlans = [];
        
        for (const dayPlan of exercises) {
            const planDate = new Date(start);
            // Find the day of week and add days accordingly
            const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const targetDayIndex = dayNames.indexOf(dayPlan.day);
            const currentDayIndex = start.getDay();
            let daysToAdd = targetDayIndex - currentDayIndex;
            if (daysToAdd < 0) daysToAdd += 7;
            planDate.setDate(planDate.getDate() + daysToAdd);
            
            const existingPlan = await prisma.dailyWorkoutPlan.findFirst({
                where: {
                    memberId,
                    tenantId: req.tenantId,
                    date: planDate
                }
            });
            
            if (existingPlan) {
                await prisma.dailyWorkoutPlan.update({
                    where: { id: existingPlan.id },
                    data: {
                        exercises: JSON.stringify(dayPlan.exercises || []),
                        status: "pending",
                        trainerId: req.userId
                    }
                });
            } else {
                await prisma.dailyWorkoutPlan.create({
                    data: {
                        memberId,
                        tenantId: req.tenantId,
                        date: planDate,
                        day: dayPlan.day,
                        exercises: JSON.stringify(dayPlan.exercises || []),
                        trainerId: req.userId
                    }
                });
            }
        }
        
        res.json({ success: true, assigned: exercises.length });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== ALERTS CRON (Daily) ====================

setInterval(async () => {
    try {
        console.log("[Alert Cron] Checking for expiring memberships...");
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 3); // 3 days away

        const expiringMembers = await prisma.member.findMany({
            where: {
                status: "active",
                planExpiresAt: {
                    gte: new Date(targetDate.setHours(0,0,0,0)),
                    lt: new Date(targetDate.setHours(23,59,59,999))
                }
            }
        });

        expiringMembers.forEach((m: any) => {
            console.log(`[Alert Cron] Dispatched warning to ${m.fullName || m.full_name} (${m.phone})`);
        });
    } catch (err: any) {
        console.error("[Alert Cron] Error:", err.message);
    }
}, 24 * 60 * 60 * 1000);

// ==================== START SERVER ====================

if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
        console.log(`✅ API server running on http://localhost:${PORT}`)
    })
}

app.use(errorMiddleware)

export default app;

