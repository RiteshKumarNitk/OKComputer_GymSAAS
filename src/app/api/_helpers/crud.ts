import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Generic CRUD helper for tenant-scoped resources
export function createCrudHandler(modelName: string, options?: {
    include?: Record<string, any>
    searchFields?: string[]
    filterFields?: string[]
}) {
    const model = (prisma as any)[modelName]

    return {
        async GET(request: Request) {
            const { searchParams } = new URL(request.url)
            const tenantId = searchParams.get("tenantId")
            const search = searchParams.get("search")
            const id = searchParams.get("id")

            if (id) {
                const item = await model.findUnique({
                    where: { id },
                    ...(options?.include ? { include: options.include } : {}),
                })
                return NextResponse.json(item)
            }

            const where: any = {}
            if (tenantId) where.tenantId = tenantId

            // Add search filter
            if (search && options?.searchFields?.length) {
                where.OR = options.searchFields.map((field: string) => ({
                    [field]: { contains: search, mode: "insensitive" },
                }))
            }

            // Add additional filters from query params
            if (options?.filterFields) {
                for (const field of options.filterFields) {
                    const value = searchParams.get(field)
                    if (value && value !== "all") {
                        where[field] = value
                    }
                }
            }

            const items = await model.findMany({
                where,
                ...(options?.include ? { include: options.include } : {}),
                orderBy: { createdAt: "desc" },
            })
            return NextResponse.json(items)
        },

        async POST(request: Request) {
            const body = await request.json()
            const item = await model.create({ data: body })
            return NextResponse.json(item)
        },

        async PATCH(request: Request) {
            const { searchParams } = new URL(request.url)
            const id = searchParams.get("id")
            if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

            const body = await request.json()
            const item = await model.update({
                where: { id },
                data: body,
            })
            return NextResponse.json(item)
        },

        async DELETE(request: Request) {
            const { searchParams } = new URL(request.url)
            const id = searchParams.get("id")
            if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

            await model.delete({ where: { id } })
            return NextResponse.json({ success: true })
        },
    }
}
