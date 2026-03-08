import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")
    const type = searchParams.get("type") // revenue, attendance, member-growth
    if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 })

    if (type === "revenue") {
        const payments = await prisma.payment.findMany({
            where: { tenantId, status: "paid" },
            select: { amountCents: true, paidAt: true },
            orderBy: { paidAt: "asc" },
        })
        return NextResponse.json(payments)
    }

    if (type === "attendance") {
        const records = await prisma.attendance.findMany({
            where: { tenantId },
            select: { checkinAt: true },
            orderBy: { checkinAt: "asc" },
        })
        return NextResponse.json(records)
    }

    if (type === "member-growth") {
        const members = await prisma.member.findMany({
            where: { tenantId },
            select: { createdAt: true },
            orderBy: { createdAt: "asc" },
        })
        return NextResponse.json(members)
    }

    return NextResponse.json({ error: "type parameter required" }, { status: 400 })
}
