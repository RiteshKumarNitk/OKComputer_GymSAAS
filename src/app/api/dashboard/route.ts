import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")
    if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 })

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalMembers, activeMembers, newMembersThisMonth, attendanceToday, payments, monthlyPayments] = await Promise.all([
        prisma.member.count({ where: { tenantId } }),
        prisma.member.count({ where: { tenantId, status: "active" } }),
        prisma.member.count({ where: { tenantId, createdAt: { gte: startOfMonth } } }),
        prisma.attendance.count({
            where: { tenantId, checkinAt: { gte: new Date(now.toISOString().split("T")[0]) } },
        }),
        prisma.payment.aggregate({ where: { tenantId, status: "paid" }, _sum: { amountCents: true } }),
        prisma.payment.aggregate({
            where: { tenantId, status: "paid", paidAt: { gte: startOfMonth } },
            _sum: { amountCents: true },
        }),
    ])

    return NextResponse.json({
        totalMembers,
        activeMembers,
        newMembersThisMonth,
        attendanceToday,
        totalRevenue: (payments._sum.amountCents || 0) / 100,
        monthlyRevenue: (monthlyPayments._sum.amountCents || 0) / 100,
    })
}
