import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")
    const memberId = searchParams.get("memberId")
    const date = searchParams.get("date")

    const where: any = {}
    if (tenantId) where.tenantId = tenantId
    if (memberId) where.memberId = memberId
    if (date) {
        const d = new Date(date)
        where.checkinAt = { gte: new Date(d.setHours(0, 0, 0, 0)), lte: new Date(d.setHours(23, 59, 59, 999)) }
    }

    const records = await prisma.attendance.findMany({
        where,
        include: { member: { select: { fullName: true, memberCode: true } } },
        orderBy: { checkinAt: "desc" },
    })
    return NextResponse.json(records)
}

export async function POST(request: Request) {
    const body = await request.json()
    const record = await prisma.attendance.create({ data: body })
    return NextResponse.json(record)
}

export async function PATCH(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
    const record = await prisma.attendance.update({ where: { id }, data: { checkoutAt: new Date() } })
    return NextResponse.json(record)
}
