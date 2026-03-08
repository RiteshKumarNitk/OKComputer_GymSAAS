/**
 * Seed the Super Admin user
 * Run: npx tsx --env-file=.env server/seed-admin.ts
 */
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcrypt"
import dotenv from "dotenv"

dotenv.config()

async function seedAdmin() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
    const prisma = new PrismaClient({ adapter })

    const email = "innovatex@gmail.com"
    const password = "SuparAdmin123"
    const fullName = "Super Admin"

    // Check if already exists
    const existing = await prisma.userProfile.findUnique({ where: { email } })
    if (existing) {
        console.log("⚠️  Super admin already exists:", existing.email, "| role:", existing.role)
        await prisma.$disconnect()
        return
    }

    const hashed = await bcrypt.hash(password, 10)

    const admin = await prisma.userProfile.create({
        data: {
            email,
            password: hashed,
            fullName,
            role: "super_admin",
            isActive: true,
            tenantId: null as any, // Super admin has no tenant
        },
    })

    console.log("✅ Super Admin created!")
    console.log("   Email:", admin.email)
    console.log("   Role:", admin.role)
    console.log("   ID:", admin.id)

    await prisma.$disconnect()
}

seedAdmin().catch((err) => {
    console.error("❌ Seed failed:", err)
    process.exit(1)
})
