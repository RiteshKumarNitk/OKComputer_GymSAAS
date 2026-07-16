import { Router, Request, Response } from "express"
import { prisma, authenticate } from "../config/db.js"
import { LeadScraperService } from "../services/leadScraperService.js"

const router = Router()

/**
 * POST /api/lead-agent/search
 *
 * Search for gyms in a given city via Google Places API
 * and auto-qualify them with quality scores.
 *
 * Body: { city: string }
 */
router.post("/search", authenticate, async (req: Request, res: Response) => {
  try {
    const { city } = req.body
    if (!city || typeof city !== "string" || city.trim().length === 0) {
      res.status(400).json({ error: "City name is required" })
      return
    }

    const result = await LeadScraperService.searchGyms(city.trim())
    res.json(result)
  } catch (err: any) {
    const status = err.message.includes("not configured") ? 400 : 500
    res.status(status).json({ error: err.message })
  }
})

/**
 * POST /api/lead-agent/import
 *
 * Import selected scraped gyms as leads into the tenant's database.
 *
 * Body: {
 *   gyms: ScrapedGym[],
 *   sourceLabel?: string // optional label for the source
 * }
 */
router.post("/import", authenticate, async (req: Request, res: Response) => {
  try {
    const { gyms, sourceLabel } = req.body
    if (!gyms || !Array.isArray(gyms) || gyms.length === 0) {
      res.status(400).json({ error: "Array of gyms is required" })
      return
    }

    const result = await LeadScraperService.importLeads(req.tenantId!, gyms, sourceLabel)
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/lead-agent/status
 *
 * Returns lead generation stats for the tenant.
 */
router.get("/status", authenticate, async (req: Request, res: Response) => {
  try {
    const [totalLeads, scrapedLeads, hotLeads] = await Promise.all([
      prisma.lead.count({ where: { tenantId: req.tenantId! } }),
      prisma.lead.count({ where: { tenantId: req.tenantId!, source: "scraped" } }),
      prisma.lead.count({ where: { tenantId: req.tenantId!, priority: "hot", source: "scraped" } }),
    ])

    res.json({ totalLeads, scrapedLeads, hotLeads })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
