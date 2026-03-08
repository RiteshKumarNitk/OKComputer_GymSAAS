import { createCrudHandler } from "@/app/api/_helpers/crud"
const handler = createCrudHandler("notification")
export const GET = handler.GET
export const PATCH = handler.PATCH
