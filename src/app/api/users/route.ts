import { createCrudHandler } from "@/app/api/_helpers/crud"
const handler = createCrudHandler("userProfile", {
    searchFields: ["fullName", "email"],
    filterFields: ["role", "isActive"],
})
export const GET = handler.GET
export const PATCH = handler.PATCH
