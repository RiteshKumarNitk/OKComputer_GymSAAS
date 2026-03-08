import { createCrudHandler } from "@/app/api/_helpers/crud"
const handler = createCrudHandler("memberDiet", {
    include: { dietPlan: true, assigner: { select: { fullName: true } } },
    filterFields: ["memberId"],
})
export const GET = handler.GET
export const POST = handler.POST
export const PATCH = handler.PATCH
