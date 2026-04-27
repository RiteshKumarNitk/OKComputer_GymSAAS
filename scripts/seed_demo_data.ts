import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding dummy data...")

  const tenant = await prisma.tenant.findFirst()
  if (!tenant) {
    console.error("No tenant found. Please run migrations and create a tenant first.")
    return
  }

  const tenantId = tenant.id
  console.log(`Using tenant: ${tenant.name} (${tenantId})`)

  // Add dummy leads
  const leads = [
    {
      tenantId,
      firstName: "Rahul",
      lastName: "Sharma",
      fullName: "Rahul Sharma",
      phone: "9876543210",
      email: "rahul@example.com",
      priority: "hot",
      status: "new",
      notes: "Interested in 1 year membership",
      budget: 15000,
      source: "walk-in",
      services: "[]"
    },
    {
      tenantId,
      firstName: "Priya",
      lastName: "Verma",
      fullName: "Priya Verma",
      phone: "9123456789",
      email: "priya@example.com",
      priority: "warm",
      status: "contacted",
      notes: "Asked for yoga classes",
      budget: 8000,
      source: "walk-in",
      services: "[]"
    },
    {
      tenantId,
      firstName: "Amit",
      lastName: "Singh",
      fullName: "Amit Singh",
      phone: "8888777666",
      email: "amit@example.com",
      priority: "cold",
      status: "new",
      notes: "Walk-in enquiry",
      budget: 5000,
      source: "walk-in",
      services: "[]"
    }
  ]

  for (const lead of leads) {
    const createdLead = await prisma.lead.create({
      data: lead as any
    })
    console.log(`Created lead: ${createdLead.fullName}`)

    // Add a follow-up for each lead
    await (prisma as any).followUp.create({
      data: {
        tenantId,
        leadId: createdLead.id,
        type: "enquiry",
        status: "pending",
        priority: createdLead.priority as any,
        followUpDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date in next 7 days
        notes: `Follow up with ${createdLead.firstName} about membership plans.`,
        todo: "Call in the evening"
      }
    })
  }

  console.log("Seeding completed!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
