import { prisma } from "../config/db.js"
import logger from "../config/logger.js"
import { JustDialScraper } from "./justdialScraper.js"

export interface ScrapedGym {
  name: string
  address: string
  phone: string | null
  website: string | null
  rating: number | null
  ratingCount: number | null
  placeId: string
  types: string[]
  priceLevel: number | null
  openingHours: string[] | null
  photos: string[] | null
  lat: number
  lng: number
  /** Auto-calculated lead quality score 0-100 */
  qualityScore: number
  /** Derived priority based on score */
  priority: "hot" | "warm" | "cold"
}

export interface ScrapeResult {
  source: "google_places" | "justdial"
  city: string
  total: number
  gyms: ScrapedGym[]
  summary: { hot: number; warm: number; cold: number }
}

/**
 * LeadScraperService
 *
 * Scrapes gym directories via Google Places API and auto-qualifies leads.
 * Requires GOOGLE_PLACES_API_KEY in .env
 */
export class LeadScraperService {
  private static readonly PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place"

  /**
   * Search for gyms in a given city via Google Places Text Search.
   * Returns auto-qualified results with quality scores.
   */
  static async searchGyms(city: string): Promise<ScrapeResult> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY

    // Primary: Google Places API
    if (apiKey) {
      try {
        logger.info(`[LeadScraper] Searching gyms near "${city}" via Google Places...`)

        // Step 1: Text Search to find gyms
        const searchUrl = `${this.PLACES_API_BASE}/textsearch/json?query=gyms+in+${encodeURIComponent(city)}&key=${apiKey}`
        const searchRes = await fetch(searchUrl)
        const searchData = await searchRes.json() as any

        if (searchData.status === "OK" && searchData.results?.length > 0) {
          // Step 2: Get detailed Place info for each result (phone, website, hours)
          const gyms: ScrapedGym[] = []

          for (const place of searchData.results.slice(0, 20)) {
            const details = await this.getPlaceDetails(place.place_id, apiKey)
            const gym = this.buildScrapedGym(place, details, city)
            gyms.push(gym)
          }

          // Step 3: Sort by quality score descending
          gyms.sort((a, b) => b.qualityScore - a.qualityScore)

          const summary = {
            hot: gyms.filter((g) => g.priority === "hot").length,
            warm: gyms.filter((g) => g.priority === "warm").length,
            cold: gyms.filter((g) => g.priority === "cold").length,
          }

          logger.info(`[LeadScraper] Google Places: Found ${gyms.length} gyms near "${city}" (${summary.hot} hot, ${summary.warm} warm, ${summary.cold} cold)`)

          return { source: "google_places", city, total: gyms.length, gyms, summary }
        }

        if (searchData.status !== "ZERO_RESULTS") {
          logger.warn(`[LeadScraper] Google Places API error: ${searchData.status} - ${searchData.error_message || "Unknown"}. Falling back to JustDial...`)
        } else {
          logger.info(`[LeadScraper] Google Places returned zero results for "${city}". Falling back to JustDial...`)
        }
      } catch (err: any) {
        logger.warn(`[LeadScraper] Google Places search failed: ${err.message}. Falling back to JustDial...`)
      }
    } else {
      logger.info(`[LeadScraper] GOOGLE_PLACES_API_KEY not configured. Using JustDial fallback...`)
    }

    // Fallback: JustDial scraper via Playwright
    logger.info(`[LeadScraper] Searching gyms near "${city}" via JustDial (Playwright)...`)
    const justDialResult = await JustDialScraper.searchGyms(city)

    return {
      source: "justdial",
      city,
      total: justDialResult.total,
      gyms: justDialResult.gyms,
      summary: justDialResult.summary,
    }
  }

  /**
   * Import selected scraped gyms as leads into the database for a tenant
   */
  static async importLeads(
    tenantId: string,
    gyms: ScrapedGym[],
    sourceLabel?: string
  ): Promise<{ imported: number; skipped: number }> {
    let imported = 0
    let skipped = 0

    for (const gym of gyms) {
      // Skip if a lead with this phone already exists for this tenant
      if (gym.phone) {
        const existing = await prisma.lead.findFirst({
          where: { tenantId, phone: gym.phone },
        })
        if (existing) {
          skipped++
          continue
        }
      }

      // Build a notes field with scraped metadata
      const notesParts: string[] = []
      if (gym.rating) notesParts.push(`Rating: ${gym.rating}/5 (${gym.ratingCount || 0} reviews)`)
      if (gym.website) notesParts.push(`Website: ${gym.website}`)
      if (gym.openingHours?.length) notesParts.push(`Hours: ${gym.openingHours.slice(0, 5).join(", ")}`)
      notesParts.push(`Quality Score: ${gym.qualityScore}/100`)
      notesParts.push(`Source: Google Places - ${sourceLabel || gym.address.split(",").slice(-2).join(",").trim()}`)

      await prisma.lead.create({
        data: {
          tenantId,
          fullName: gym.name,
          phone: gym.phone || "N/A",
          address: gym.address,
          priority: gym.priority,
          status: "new",
          source: "scraped",
          notes: notesParts.join("\n"),
        },
      })
      imported++
    }

    logger.info(`[LeadScraper] Imported ${imported} leads, skipped ${skipped} duplicates for tenant ${tenantId}`)
    return { imported, skipped }
  }

  // ──────────── Private Helpers ────────────

  private static async getPlaceDetails(placeId: string, apiKey: string): Promise<any> {
    const fields = "place_id,name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,price_level,opening_hours,photos,geometry"
    const url = `${this.PLACES_API_BASE}/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`
    const res = await fetch(url)
    const data = await res.json() as any
    if (data.status === "OK" && data.result) {
      return data.result
    }
    return {}
  }

  private static buildScrapedGym(place: any, details: any, city: string): ScrapedGym {
    const name = place.name || "Unknown Gym"
    const address = details.formatted_address || place.formatted_address || ""
    const phone = details.formatted_phone_number || null
    const website = details.website || null
    const rating = place.rating || null
    const ratingCount = place.user_ratings_total || null
    const placeId = place.place_id
    const types = place.types || []
    const priceLevel = place.price_level ?? null
    const openingHours = details.opening_hours?.weekday_text || null
    const photos = place.photos?.map((p: any) => p.photo_reference) || null
    const lat = place.geometry?.location?.lat || 0
    const lng = place.geometry?.location?.lng || 0

    const qualityScore = this.calculateQualityScore({ rating, ratingCount, website, phone, openingHours, photos, priceLevel })
    const priority = this.scoreToPriority(qualityScore)

    return { name, address, phone, website, rating, ratingCount, placeId, types, priceLevel, openingHours, photos, lat, lng, qualityScore, priority }
  }

  /**
   * Auto-qualification scoring engine.
   *
   * Signals and weights:
   *  - Has website (established business):          +20
   *  - High rating (≥4.5):                          +25
   *  - Good rating (≥4.0):                          +15
   *  - Decent rating (≥3.5):                        +5
   *  - Has phone number (reachable):                +15
   *  - Has opening hours (active operation):        +10
   *  - Has photos (invested in presence):            +5
   *  - High review count (>100):                    +10
   *  - Moderate review count (>20):                 +5
   *
   *  Total possible: 100
   *
   *  Thresholds:
   *    Hot   → 61+
   *    Warm  → 31-60
   *    Cold  → 0-30
   */
  static calculateQualityScore(signals: {
    rating: number | null
    ratingCount: number | null
    website: string | null
    phone: string | null
    openingHours: string[] | null
    photos: string[] | null
    priceLevel: number | null
  }): number {
    let score = 0

    // Website — high intent signal
    if (signals.website) score += 20

    // Rating quality
    if (signals.rating !== null) {
      if (signals.rating >= 4.5) score += 25
      else if (signals.rating >= 4.0) score += 15
      else if (signals.rating >= 3.5) score += 5
    }

    // Phone number — reachable
    if (signals.phone) score += 15

    // Operating hours — active business
    if (signals.openingHours && signals.openingHours.length > 0) score += 10

    // Photos — invested in online presence
    if (signals.photos && signals.photos.length > 0) score += 5

    // Review count — social proof
    if (signals.ratingCount !== null) {
      if (signals.ratingCount > 100) score += 10
      else if (signals.ratingCount > 20) score += 5
    }

    // Price level indicator (optional signal)
    if (signals.priceLevel !== null && signals.priceLevel >= 2) score += 5

    // Bonus for having both phone AND website (highly qualified)
    if (signals.phone && signals.website) score += 5

    return Math.min(score, 100)
  }

  private static scoreToPriority(score: number): "hot" | "warm" | "cold" {
    if (score >= 61) return "hot"
    if (score >= 31) return "warm"
    return "cold"
  }
}
