import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const tenantId = (session.user as any).tenantId
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get("memberId")

    const payments = await prisma.payment.findMany({
        where: {
            tenantId: tenantId,
            ...(memberId ? { memberId } : {})
        },
        include: {
            member: {
                select: { fullName: true, memberCode: true }
            },
            membership: {
                select: { name: true }
            }
        },
        orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(payments)
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const tenantId = (session.user as any).tenantId
    const body = await request.json()

    // Use a transaction to ensure both payment and potential membership update are handled
    const result = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.create({
            data: {
                ...body,
                tenantId: tenantId,
                status: "paid",
                paidAt: new Date()
            }
        })

        // If payment is for a membership, update the member's plan
        if (body.membershipId && body.memberId) {
            const membership = await tx.membership.findUnique({
                where: { id: body.membershipId }
            })

            if (membership) {
                const startDate = new Date()
                const endDate = new Date()
                endDate.setDate(endDate.getDate() + membership.durationDays)

                await tx.member.update({
                    where: { id: body.memberId },
                    data: {
                        currentPlanId: membership.id,
                        planStartedAt: startDate,
                        planExpiresAt: endDate,
                        status: "active"
                    }
                })
            }
        }

        return payment
    })

    return NextResponse.json(result)
}
