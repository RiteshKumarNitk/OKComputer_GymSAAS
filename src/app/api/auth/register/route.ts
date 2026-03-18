import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcrypt"
import { Prisma } from "@prisma/client"

export async function POST(request: Request) {
    try {
        const { email, password, fullName, tenantName, slug } = await request.json()

        if (!email || !password || !tenantName || !slug) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create Tenant and UserProfile in a transaction
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Create Tenant
            const tenant = await tx.tenant.create({
                data: {
                    name: tenantName,
                    slug: slug,
                    email: email
                }
            })

            // 2. Create UserProfile linked to Tenant
            const user = await tx.userProfile.create({
                data: {
                    email: email,
                    password: hashedPassword,
                    fullName: fullName,
                    role: "gym_owner",
                    tenantId: tenant.id
                }
            })

            // 3. Update Tenant with owner user id
            await tx.tenant.update({
                where: { id: tenant.id },
                data: { ownerUserId: user.id }
            })

            return { tenant, user }
        })

        return NextResponse.json({
            message: "Tenant created successfully",
            tenantId: result.tenant.id
        })

    } catch (error: any) {
        console.error("Registration error:", error)
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Email or Slug already exists" }, { status: 409 })
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
