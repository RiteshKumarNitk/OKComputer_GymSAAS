import { createCrudHandler } from "@/app/api/_helpers/crud"
const handler = createCrudHandler("product")
export const GET = handler.GET
export const POST = handler.POST
export const PATCH = handler.PATCH
export const DELETE = handler.DELETE
