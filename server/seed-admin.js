import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcrypt'

async function seedAdmin() {
    console.log("1. Inside seedAdmin")
    console.log("DATABASE_URL present:", !!process.env.DATABASE_URL)
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
    console.log("2. Adapter created")
    const prisma = new PrismaClient({ adapter })
    console.log("3. PrismaClient created")

    const email = "innovatex@gmail.com"
    const password = "SuparAdmin123"
    const fullName = "Super Admin"

    console.log("4. Hashing password")
    const hashed = await bcrypt.hash(password, 10)
    console.log("5. Password hashed")

    try {
        console.log("6. Finding unique user email...")
        const existing = await prisma.userProfile.findUnique({ where: { email } })
        console.log("7. Unique find complete. Existing:", existing ? "Found" : "Not Found")
        if (existing) {
            await prisma.userProfile.update({
                where: { email },
                data: { passwordHash: hashed, role: "super_admin", isActive: true },
            })
            console.log("✅ Super Admin password updated!")
        } else {
            await prisma.userProfile.create({
                data: {
                    email,
                    passwordHash: hashed,
                    fullName,
                    role: "super_admin",
                    isActive: true,
                },
            })
            console.log("✅ Super Admin created!")
        }
    } catch (e) {
        console.error("❌ Seed Error Inside Try:", e)
    } finally {
        await prisma.$disconnect()
    }
}

console.log("0. Executing seedAdmin...")
seedAdmin()
  .then(() => console.log("8. seedAdmin resolved"))
  .catch((err) => console.error("❌ seedAdmin rejected:", err));
