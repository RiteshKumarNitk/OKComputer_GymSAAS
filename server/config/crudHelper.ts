import { Application, Response } from "express"
import { prisma, snakeToCamel, authenticate, AuthenticatedRequest } from "./db.js"

interface CrudOptions {
  searchFields?: string[]
  filterFields?: string[]
  include?: any
  roles?: {
    list?: string[]
    create?: string[]
    update?: string[]
    delete?: string[]
  }
}

/**
 * Generates CRUD routes (List with pagination/filtering, Create, Update, Delete)
 * for a given Prisma model with tenant isolation, role-based access control,
 * and automatic snake_case → camelCase conversion.
 *
 * @param app - Express application instance
 * @param path - URL path prefix (e.g., "members", "trainers")
 * @param modelName - Prisma model name (e.g., "member", "trainer")
 * @param opts - Optional configuration for search, filter, includes, and role guards
 */
export function createCrudRoutes(
  app: Application,
  path: string,
  modelName: string,
  opts?: CrudOptions
) {
  const model = (prisma as any)[modelName]
  const defaultMutationRoles = ["gym_owner", "manager"]

  // LIST
  app.get(`/api/${path}`, authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allowed = opts?.roles?.list || ["gym_owner", "manager", "frontdesk", "trainer"]
      if (!allowed.includes(req.role)) { res.status(403).json({ error: "Access denied." }); return }

      const isTenantModel = modelName === "tenant"
      const isSuperAdmin = req.role === "super_admin"

      const where: any = {}
      if (!isSuperAdmin) {
        if (isTenantModel) {
          where.id = req.tenantId
        } else {
          where.tenantId = req.tenantId
        }
      }

      if (req.query.id) {
        const queryId = req.query.id as string
        const item = await model.findFirst({
          where: { id: queryId, ...(isSuperAdmin ? {} : (isTenantModel ? { id: req.tenantId } : { tenantId: req.tenantId })) },
          ...(opts?.include ? { include: opts.include } : {})
        })
        if (!item) { res.status(404).json({ error: "Item not found" }); return }
        res.json(snakeToCamel(item)); return
      }

      if (req.query.search && opts?.searchFields?.length) {
        where.OR = opts.searchFields.map((f: string) => ({ [f]: { contains: req.query.search as string, mode: "insensitive" } }))
      }
      if (opts?.filterFields) {
        for (const f of opts.filterFields) {
          if (req.query[f] && req.query[f] !== "all") where[f] = req.query[f] as string
        }
      }
      if (req.query.memberId) where.memberId = req.query.memberId as string
      if (req.query.trainerId) where.trainerId = req.query.trainerId as string

      if (req.role === "member") {
        if (modelName === "member") {
          where.userId = req.userId
        } else if (opts?.filterFields?.includes("memberId")) {
          where.memberId = req.userId
        }
      }

      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50))
      const skip = (page - 1) * limit

      const [items, totalCount] = await Promise.all([
        model.findMany({
          where,
          ...(opts?.include ? { include: opts.include } : {}),
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        model.count({ where }),
      ])

      const safeItems = items.map((item: any) => {
        const { passwordHash, ...rest } = item
        return rest
      })

      res.setHeader("X-Total-Count", totalCount.toString())
      res.setHeader("X-Page", page.toString())
      res.setHeader("X-Limit", limit.toString())
      res.setHeader("X-Total-Pages", Math.ceil(totalCount / limit).toString())
      res.json(snakeToCamel(safeItems))
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // CREATE
  app.post(`/api/${path}`, authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allowed = opts?.roles?.create || defaultMutationRoles
      if (!allowed.includes(req.role)) { res.status(403).json({ error: "Access denied." }); return }

      const body = Array.isArray(req.body) ? req.body[0] : req.body
      const isTenantModel = modelName === "tenant"
      const data = { ...snakeToCamel(body), ...(isTenantModel ? {} : { tenantId: req.tenantId }) }

      const item = await model.create({ data })
      res.json(snakeToCamel(item))
    } catch (err: any) {
      console.error(`POST /api/${path} error:`, err.message)
      res.status(500).json({ error: err.message })
    }
  })

  // UPDATE
  app.patch(`/api/${path}`, authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allowed = opts?.roles?.update || defaultMutationRoles
      if (!allowed.includes(req.role)) { res.status(403).json({ error: "Access denied." }); return }

      const id = req.query.id as string
      if (!id) { res.status(400).json({ error: "ID required" }); return }

      const isTenantModel = modelName === "tenant"
      const isSuperAdmin = req.role === "super_admin"

      const result = await model.updateMany({
        where: { id, ...(isSuperAdmin ? {} : (isTenantModel ? { id: req.tenantId } : { tenantId: req.tenantId })) },
        data: snakeToCamel(req.body)
      })

      if (result.count === 0) { res.status(404).json({ error: "Item not found or access denied" }); return }

      const updated = await model.findUnique({ where: { id } })
      res.json(snakeToCamel(updated))
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // DELETE
  app.delete(`/api/${path}`, authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allowed = opts?.roles?.delete || defaultMutationRoles
      if (!allowed.includes(req.role)) { res.status(403).json({ error: "Access denied." }); return }

      const id = req.query.id as string
      if (!id) { res.status(400).json({ error: "ID required" }); return }

      const isTenantModel = modelName === "tenant"
      const isSuperAdmin = req.role === "super_admin"

      const result = await model.deleteMany({
        where: { id, ...(isSuperAdmin ? {} : (isTenantModel ? { id: req.tenantId } : { tenantId: req.tenantId })) }
      })

      if (result.count === 0) { res.status(404).json({ error: "Item not found or access denied" }); return }
      res.json({ success: true })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })
}
