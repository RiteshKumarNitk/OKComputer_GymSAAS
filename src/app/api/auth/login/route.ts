import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password required" }, { status: 400 })
        }

        const user = await prisma.userProfile.findUnique({ where: { email } })

        if (!user || !user.password) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
        }

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
        }

        if (!user.isActive) {
            return NextResponse.json({ error: "Account disabled" }, { status: 403 })
        }

        const secret = process.env.NEXTAUTH_SECRET || "gym-saas-secret"
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
            secret,
            { expiresIn: "7d" }
        )

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                tenantId: user.tenantId,
                avatarUrl: user.avatarUrl,
            },
            token,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Login failed" }, { status: 500 })
    }
}
