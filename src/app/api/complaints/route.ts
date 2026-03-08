import { createCrudHandler } from "@/app/api/_helpers/crud"
const handler = createCrudHandler("complaint", {
    include: { member: { select: { fullName: true } } },
    filterFields: ["status", "priority"],
})
export const GET = handler.GET
export const POST = handler.POST
export const PATCH = handler.PATCH
