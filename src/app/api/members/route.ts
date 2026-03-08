import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")
    const search = searchParams.get("search")
    const status = searchParams.get("status")

    const where: any = {}
    if (tenantId) where.tenantId = tenantId
    if (status && status !== "all") where.status = status
    if (search) {
        where.OR = [
            { fullName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { memberCode: { contains: search, mode: "insensitive" } },
        ]
    }

    const members = await prisma.member.findMany({
        where,
        include: { currentPlan: true, assignedTrainer: true },
        orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(members)
}

export async function POST(request: Request) {
    const body = await request.json()
    const member = await prisma.member.create({ data: body })
    return NextResponse.json(member)
}

export async function PATCH(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
    const body = await request.json()
    const member = await prisma.member.update({ where: { id }, data: body })
    return NextResponse.json(member)
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
    await prisma.member.delete({ where: { id } })
    return NextResponse.json({ success: true })
}
