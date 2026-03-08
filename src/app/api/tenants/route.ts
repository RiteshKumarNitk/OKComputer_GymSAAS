import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
    const tenants = await prisma.tenant.findMany({
        include: { _count: { select: { members: true, users: true } } },
        orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(tenants)
}

export async function POST(request: Request) {
    const body = await request.json()
    const tenant = await prisma.tenant.create({ data: body })
    return NextResponse.json(tenant)
}

export async function PATCH(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
    const body = await request.json()
    const tenant = await prisma.tenant.update({ where: { id }, data: body })
    return NextResponse.json(tenant)
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
    await prisma.tenant.delete({ where: { id } })
    return NextResponse.json({ success: true })
}
