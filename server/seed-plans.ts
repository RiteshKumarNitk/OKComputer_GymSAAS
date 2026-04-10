import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import dotenv from "dotenv"

dotenv.config()

async function seedPlans() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
    const prisma = new PrismaClient({ adapter })

    const plans = [
        {
            name: "Free Trial",
            description: "14-day full access to try OKComputer Gym SaaS",
            pricePaise: 0,
            durationDays: 14,
            features: ["members", "billing", "workouts", "attendance"],
            isActive: true,
        },
        {
            name: "Basic",
            description: "For small gyms and fitness studios",
            pricePaise: 99900,
            durationDays: 30,
            features: ["members", "billing", "workouts", "attendance"],
            isActive: true,
        },
        {
            name: "Pro",
            description: "For growing fitness centers with multiple trainers",
            pricePaise: 249900,
            durationDays: 30,
            features: ["members", "billing", "workouts", "attendance", "diet-plans", "advanced_analytics"],
            isActive: true,
        },
        {
            name: "Enterprise",
            description: "Unlimited scaling for large chains",
            pricePaise: 499900,
            durationDays: 30,
            features: ["members", "billing", "workouts", "attendance", "diet-plans", "advanced_analytics", "white_label"],
            isActive: true,
        }
    ]

    for (const plan of plans) {
        const existing = await prisma.saasPlan.findFirst({ where: { name: plan.name } })
        if (!existing) {
            await prisma.saasPlan.create({ data: plan })
            console.log(`✅ Default Plan created: ${plan.name}`)
        } else {
            console.log(`ℹ️ Plan already exists: ${plan.name}`)
        }
    }

    await prisma.$disconnect()
}

seedPlans().catch((err) => {
    console.error("❌ Seed failed:", err)
    process.exit(1)
})