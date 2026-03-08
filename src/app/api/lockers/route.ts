import { createCrudHandler } from "@/app/api/_helpers/crud"
const handler = createCrudHandler("locker", {
    include: { member: { select: { fullName: true, memberCode: true } } },
    filterFields: ["status"],
})
export const GET = handler.GET
export const POST = handler.POST
export const PATCH = handler.PATCH
