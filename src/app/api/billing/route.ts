import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // plans, subscription, invoices
    const tenantId = searchParams.get("tenantId")

    if (type === "plans") {
        const plans = await prisma.saasPlan.findMany({ where: { isActive: true }, orderBy: { priceInr: "asc" } })
        return NextResponse.json(plans)
    }

    if (type === "subscription" && tenantId) {
        const sub = await prisma.saasSubscription.findFirst({
            where: { tenantId },
            include: { plan: true },
            orderBy: { createdAt: "desc" },
        })
        return NextResponse.json(sub)
    }

    if (type === "invoices" && tenantId) {
        const invoices = await prisma.saasInvoice.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
        })
        return NextResponse.json(invoices)
    }

    return NextResponse.json({ error: "type parameter required" }, { status: 400 })
}

export async function POST(request: Request) {
    const body = await request.json()
    const subscription = await prisma.saasSubscription.create({ data: body })
    return NextResponse.json(subscription)
}
