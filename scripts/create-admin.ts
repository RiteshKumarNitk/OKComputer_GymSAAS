import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import bcrypt from "bcrypt"
import dotenv from "dotenv"

dotenv.config()

const connectionString = process.env.DATABASE_URL!
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    const email = "admin@gympro.com"
    const password = "admin123password"
    const fullName = "System Administrator"

    console.log("Checking for existing super admin...")
    const existing = await prisma.userProfile.findFirst({
        where: { role: "super_admin" }
    })

    if (existing) {
        console.log("Super Admin already exists:", existing.email)
        return
    }

    console.log("Creating Super Admin...")
    const hashedPassword = await bcrypt.hash(password, 10)

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Ensure system tenant exists
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
                    password: hashedPassword,
                    fullName,
                    role: "super_admin",
                    tenantId: systemTenant.id,
                }
            })

            await tx.tenant.update({
                where: { id: systemTenant.id },
                data: { ownerUserId: user.id }
            })

            return user
        })

        console.log("✅ Super Admin created successfully!")
        console.log("Email:", email)
        console.log("Password:", password)
        console.log("\nYou can now login at /signin")
    } catch (error: any) {
        console.error("❌ Failed to create Super Admin:")
        console.error(error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
