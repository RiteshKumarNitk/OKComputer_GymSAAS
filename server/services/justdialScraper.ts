import { chromium, type Page, type Browser, type Route } from "playwright"
import logger from "../config/logger.js"
import type { ScrapedGym } from "./leadScraperService.js"

export interface JustDialResult {
  source: "justdial"
  city: string
  total: number
  gyms: ScrapedGym[]
  summary: { hot: number; warm: number; cold: number }
}

// ──────────── Browser Singleton ────────────
let sharedBrowser: Browser | null = null
let browserLastUsed = 0
const BROWSER_TTL_MS = 5 * 60 * 1000 // Recycle browser after 5 min of inactivity

async function getBrowser(): Promise<Browser> {
  const now = Date.now()
  if (sharedBrowser && now - browserLastUsed < BROWSER_TTL_MS) {
    browserLastUsed = now
    return sharedBrowser
  }
  // Close stale browser if any
  if (sharedBrowser) {
    try { await sharedBrowser.close() } catch { /* ignore */ }
    sharedBrowser = null
  }
  sharedBrowser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
      // Hide automation flags from JS detection
      "--disable-blink-features=AutomationControlled",
    ],
  })
  browserLastUsed = now
  return sharedBrowser
}

/**
 * JustDialScraper
 *
 * Scrapes gym listings from JustDial using Playwright with stealth techniques.
 * Used as a fallback when Google Places API is not configured.
 *
 * URL pattern: https://www.justdial.com/{City}/Gyms
 */
export class JustDialScraper {
  private static readonly BASE_URL = "https://www.justdial.com"
  private static readonly TIMEOUT = 35000
  // Known internal API endpoints JustDial uses to fetch listing data
  /**
   * Search for gyms in a given city via JustDial.
   */
  static async searchGyms(city: string): Promise<JustDialResult> {
    logger.info(`[JustDialScraper] Searching gyms near "${city}"...`)

    let page: Page | null = null
    let browser: Browser | null = null

    try {
      browser = await getBrowser()
      const context = await browser.newContext({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        viewport: { width: 1920, height: 1080 },
        locale: "en-IN",
        timezoneId: "Asia/Kolkata",
        geolocation: { latitude: 20.5937, longitude: 78.9629 }, // India center
        permissions: ["geolocation"],
      })

      page = await context.newPage()

      // ── Intercept network requests to discover internal JSON APIs ──
      const apiResponses: { url: string; body: string }[] = []
      await page.route("**/*", async (route: Route, request) => {
        const url = request.url()
        // Intercept XHR/fetch requests that look like internal APIs
        if (
          request.resourceType() === "xhr" ||
          request.resourceType() === "fetch" ||
          url.includes("/api/") ||
          url.includes("listing") ||
          url.includes("search")
        ) {
          try {
            const response = await route.fetch()
            const contentType = response.headers()["content-type"] || ""
            const body = await response.text()
            if (contentType.includes("json")) {
              apiResponses.push({ url, body })
            }
            await route.fulfill({ body, contentType, headers: response.headers() })
          } catch {
            await route.continue()
          }
        } else {
          await route.continue()
        }
      })

      // ── Navigate to JustDial gym listings ──
      const searchUrl = `${this.BASE_URL}/${encodeURIComponent(city)}/Gyms`
      logger.info(`[JustDialScraper] Navigating to ${searchUrl}`)

      await page.goto(searchUrl, {
        waitUntil: "domcontentloaded",
        timeout: this.TIMEOUT,
      })

      // ── Wait for listing content to appear ──
      await this.waitForListingContent(page)

      // Small delay for JS rendering
      await this.humanDelay(1500, 3000)

      // ── Try extraction strategies in order ──

      // Strategy 1: Internal API responses (most reliable)
      let gyms = await this.extractFromApiResponses(apiResponses)
      if (gyms.length > 0) {
        logger.info(`[JustDialScraper] Extracted ${gyms.length} gyms from internal APIs`)
        const uniqueGyms = this.deduplicate(gyms)
        return this.buildResult(uniqueGyms, city)
      }

      // Strategy 2: Embedded JSON-LD
      gyms = await this.extractFromJson(page)
      if (gyms.length > 5) {
        logger.info(`[JustDialScraper] Extracted ${gyms.length} gyms from JSON-LD`)
        const uniqueGyms = this.deduplicate(gyms)
        return this.buildResult(uniqueGyms, city)
      }

      // Strategy 3: DOM extraction (first pass)
      gyms = await this.extractFromDom(page)
      if (gyms.length > 0) {
        logger.info(`[JustDialScraper] Extracted ${gyms.length} gyms from DOM (first pass)`)
        const uniqueGyms = this.deduplicate(gyms)
        return this.buildResult(uniqueGyms, city)
      }

      // Strategy 4: Scroll and retry DOM extraction
      logger.info("[JustDialScraper] First pass yielded no results, scrolling...")
      await this.simulateScrolling(page, 4)
      gyms = await this.extractFromDom(page)
      if (gyms.length > 0) {
        logger.info(`[JustDialScraper] Extracted ${gyms.length} gyms from DOM (after scroll)`)
        return this.buildResult(this.deduplicate(gyms), city)
      }

      logger.info(`[JustDialScraper] No gyms found near "${city}" from JustDial`)
      return { source: "justdial", city, total: 0, gyms: [], summary: { hot: 0, warm: 0, cold: 0 } }
    } catch (err: any) {
      logger.error(`[JustDialScraper] Error searching "${city}": ${err.message}`)
      return { source: "justdial", city, total: 0, gyms: [], summary: { hot: 0, warm: 0, cold: 0 } }
    } finally {
      if (page) {
        await page.close().catch(() => {})
      }
    }
  }

  // ──────────── Extraction Strategies ────────────

  /**
   * Strategy 1: Parse internal JSON API responses intercepted during navigation.
   * JustDial loads listing data via XHR/fetch to internal APIs.
   */
  private static async extractFromApiResponses(
    responses: { url: string; body: string }[]
  ): Promise<ScrapedGym[]> {
    const gyms: ScrapedGym[] = []

    for (const { url, body } of responses) {
      try {
        const data = JSON.parse(body)

        // Try to find listing arrays in various API response shapes
        const listings = this.findListingsInJson(data)
        if (listings.length === 0) continue

        for (const item of listings) {
          const name = item.name || item.businessName || item.title || ""
          if (!name || !this.isGymRelated(name.toLowerCase())) continue

          const address = item.address || item.fullAddress || item.location || ""
          const phone = this.cleanPhone(item.phone || item.phoneNo || item.mobile || item.telephone || "")
          const rating = parseFloat(item.rating || item.avgRating || item.aggregateRating) || null
          const ratingCount = parseInt(item.totalRating || item.reviewCount || item.userRating) || null
          const website = item.website || item.websiteUrl || null

          const placeId = `justdial-${name.replace(/\s+/g, "-").toLowerCase()}-${Math.random().toString(36).slice(2, 6)}`
          const qualityScore = this.calculateJustDialScore({ rating, phone: phone || null, website })
          const priority = this.scoreToPriority(qualityScore)

          gyms.push({
            name,
            address: typeof address === "string" ? address : "",
            phone: phone || null,
            website,
            rating,
            ratingCount,
            placeId,
            types: ["gym"],
            priceLevel: null,
            openingHours: null,
            photos: null,
            lat: item.lat || item.latitude || 0,
            lng: item.lng || item.longitude || 0,
            qualityScore,
            priority,
          })
        }
      } catch {
        // Not valid JSON, skip
      }
    }

    return gyms
  }

  /**
   * Recursively search a JSON object for listing arrays
   */
  private static findListingsInJson(data: any): any[] {
    if (!data || typeof data !== "object") return []

    // Direct array
    if (Array.isArray(data)) {
      // If it's an array of objects with recognizable fields, return it
      if (data.length > 0 && typeof data[0] === "object" && (data[0].name || data[0].businessName || data[0].title)) {
        return data
      }
      // Otherwise search each element
      for (const item of data) {
        const found = this.findListingsInJson(item)
        if (found.length > 0) return found
      }
      return []
    }

    // Look for known listing field names
    const listingKeys = ["results", "listings", "data", "items", "stores", "businessList", "searchResults", "products", "records"]
    for (const key of listingKeys) {
      if (data[key] && Array.isArray(data[key]) && data[key].length > 0) {
        return data[key]
      }
    }

    // Search all values recursively
    for (const value of Object.values(data)) {
      const found = this.findListingsInJson(value)
      if (found.length > 0) return found
    }

    return []
  }

  /**
   * Strategy 2: Extract from JSON-LD structured data
   */
  private static async extractFromJson(page: Page): Promise<ScrapedGym[]> {
    try {
      const jsonLdScripts = await page.$$eval('script[type="application/ld+json"]', (scripts) =>
        scripts.map((s) => s.textContent || "").filter(Boolean)
      )

      const gyms: ScrapedGym[] = []

      for (const scriptContent of jsonLdScripts) {
        try {
          const parsed = JSON.parse(scriptContent)
          const items = Array.isArray(parsed) ? parsed : parsed.itemListElement || [parsed]

          for (const item of items) {
            const entity = item.item || item
            const name = entity.name
            if (!name) continue
            if (!this.isGymRelated(name.toLowerCase())) continue

            const address = entity.address?.streetAddress || entity.address?.addressLocality || ""
            const phone = entity.telephone || entity.address?.telephone || null
            const rating = entity.aggregateRating?.ratingValue
              ? parseFloat(entity.aggregateRating.ratingValue)
              : null
            const ratingCount = entity.aggregateRating?.reviewCount
              ? parseInt(entity.aggregateRating.reviewCount)
              : null
            const website = entity.url || entity.sameAs || null

            const qualityScore = this.calculateJustDialScore({ rating, phone, website })
            const priority = this.scoreToPriority(qualityScore)

            gyms.push({
              name,
              address: address || "",
              phone: phone ? this.cleanPhone(phone) : null,
              website,
              rating,
              ratingCount,
              placeId: `justdial-${name.replace(/\s+/g, "-").toLowerCase()}`,
              types: ["gym"],
              priceLevel: null,
              openingHours: null,
              photos: null,
              lat: 0,
              lng: 0,
              qualityScore,
              priority,
            })
          }
        } catch {
          // Skip invalid JSON
        }
      }

      return gyms
    } catch (err: any) {
      logger.warn(`[JustDialScraper] JSON extraction failed: ${err.message}`)
      return []
    }
  }

  /**
   * Strategy 3: Extract from rendered DOM elements.
   * Uses progressively broader selectors and scoped heading search.
   */
  private static async extractFromDom(page: Page): Promise<ScrapedGym[]> {
    try {
      // Strategy A: Try common listing container selectors
      const containerSelectors = [
        "[class*='store-result']",
        "[class*='listing']",
        "[data-result-index]",
        ".search-result-item",
        "div[class*='result']",
        "div[class*='card'][class*='store']",
      ]

      let results: any[] = []
      for (const selector of containerSelectors) {
        const elements = await page.$$(selector)
        if (elements.length > 2) {
          results = elements
          break
        }
      }

      if (results.length > 0) {
        return await this.extractFromContainers(page, results)
      }

      // Strategy B: Scoped heading extraction — only from content area, skip header/footer/nav
      // The gym-related check keywords need to be available in the browser context
      const gymKeywords = ["gym", "fitness", "fitne", "workout", "crossfit", "bodybuilding",
        "strength", "muscle", "health club", "sports", "yoga", "zumba",
        "aerobics", "cardio", "training", "martial arts", "boxing",
        "wellness", "spa", "health", "exercise"]
      const headingEntries = await page.evaluate((keywords: string[]) => {
        const contentAreas = document.querySelectorAll(
          "main, [role='main'], #content, #results, .content-area, [class*='content'], #listing"
        )

        const headings: string[] = []
        if (contentAreas.length > 0) {
          contentAreas.forEach((area) => {
            area.querySelectorAll("h2, h3, h4, strong").forEach((el) => {
              const text = el.textContent?.trim()
              if (text && text.length > 2 && keywords.some((kw) => text.toLowerCase().includes(kw))) {
                const parent = el.closest("div, li, section, article")
                const context = parent ? parent.textContent || "" : document.body.textContent || ""
                headings.push(JSON.stringify({ name: text, context }))
              }
            })
          })
        }
        return headings
      }, gymKeywords)

      const domGyms: ScrapedGym[] = []
      for (const headingData of headingEntries) {
        try {
          const { name, context } = JSON.parse(headingData)
          const phone = this.extractPhone(context)
          const address = this.extractAddress(context)
          const rating = this.extractRating(context)
          const qualityScore = this.calculateJustDialScore({ rating, phone, website: null })
          const priority = this.scoreToPriority(qualityScore)

          domGyms.push({
            name,
            address,
            phone: phone ? this.cleanPhone(phone) : null,
            website: null,
            rating,
            ratingCount: null,
            placeId: `justdial-${name.replace(/\s+/g, "-").toLowerCase()}`,
            types: ["gym"],
            priceLevel: null,
            openingHours: null,
            photos: null,
            lat: 0,
            lng: 0,
            qualityScore,
            priority,
          })
        } catch {
          // Skip
        }
      }

      return this.deduplicate(domGyms)
    } catch (err: any) {
      logger.warn(`[JustDialScraper] DOM extraction failed: ${err.message}`)
      return []
    }
  }

  /**
   * Extract data from identified listing container elements
   */
  private static async extractFromContainers(page: Page, containers: any[]): Promise<ScrapedGym[]> {
    const gyms: ScrapedGym[] = []

    for (const container of containers) {
      try {
        const text = await container.textContent().catch(() => "")
        if (!text) continue

        // Find name element
        const nameEl = await container.$("h2, h3, h4, strong, a[class*='name'], [class*='title']")
        const name = nameEl ? (await nameEl.textContent())?.trim() : ""
        if (!name || name.length < 2) continue
        if (!this.isGymRelated(name.toLowerCase())) continue

        const phone = this.extractPhone(text)
        const address = this.extractAddress(text)
        const rating = this.extractRating(text)

        const linkEl = await container.$("a[href*='http']")
        const website = linkEl ? await linkEl.getAttribute("href").catch(() => null) : null

        const qualityScore = this.calculateJustDialScore({ rating, phone, website })
        const priority = this.scoreToPriority(qualityScore)

        gyms.push({
          name,
          address,
          phone: phone ? this.cleanPhone(phone) : null,
          website,
          rating,
          ratingCount: null,
          placeId: `justdial-${name.replace(/\s+/g, "-").toLowerCase()}`,
          types: ["gym"],
          priceLevel: null,
          openingHours: null,
          photos: null,
          lat: 0,
          lng: 0,
          qualityScore,
          priority,
        })
      } catch {
        // Skip failing containers
      }
    }

    return this.deduplicate(gyms)
  }

  // ──────────── Wait Helpers ────────────

  /**
   * Wait for listing content to appear on the page.
   * Tries multiple known JustDial selectors with a timeout.
   */
  private static async waitForListingContent(page: Page): Promise<void> {
    const listingSelectors = [
      "[class*='store-result']",
      "[class*='listing']",
      "[data-result-index]",
      ".search-result-item",
      "section[class*='result']",
      "div[class*='card']",
      // JustDial often has a search stats div
      "[class*='search-result']",
      "[class*='result-box']",
      // Generic content indicator
      "main",
    ]

    for (const selector of listingSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 8000 })
        return // Found listing content
      } catch {
        // Try next selector
      }
    }

    // If none found, wait a bit more for JS rendering
    await this.humanDelay(2000, 4000)
  }

  /**
   * Simulate human-like scrolling to trigger lazy loading
   */
  private static async simulateScrolling(page: Page, times: number): Promise<void> {
    for (let i = 0; i < times; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight * 1.2)
      })
      await this.humanDelay(800, 2000)
    }
  }

  /**
   * Random delay to mimic human behavior
   */
  private static async humanDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1) + min)
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  // ──────────── Utility Methods ────────────

  private static buildResult(gyms: ScrapedGym[], city: string): JustDialResult {
    gyms.sort((a, b) => b.qualityScore - a.qualityScore)
    const summary = {
      hot: gyms.filter((g) => g.priority === "hot").length,
      warm: gyms.filter((g) => g.priority === "warm").length,
      cold: gyms.filter((g) => g.priority === "cold").length,
    }
    logger.info(
      `[JustDialScraper] Found ${gyms.length} gyms near "${city}" ` +
      `(${summary.hot} hot, ${summary.warm} warm, ${summary.cold} cold)`
    )
    return { source: "justdial", city, total: gyms.length, gyms, summary }
  }

  private static deduplicate(gyms: ScrapedGym[]): ScrapedGym[] {
    const seen = new Set<string>()
    return gyms.filter((g) => {
      const key = g.name.toLowerCase().trim()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  private static isGymRelated(name: string): boolean {
    const keywords = [
      "gym", "fitness", "fitne", "workout", "crossfit", "bodybuilding",
      "strength", "muscle", "health club", "sports", "yoga", "zumba",
      "aerobics", "cardio", "training", "martial arts", "boxing",
      "wellness", "spa", "health", "exercise",
    ]
    return keywords.some((kw) => name.includes(kw))
  }

  private static extractPhone(text: string): string | null {
    const patterns = [
      /(\+91[\s-]?)?(\d{10})/,
      /(\+91[\s-]?)?0?(\d{4}[\s-]\d{3}[\s-]\d{3})/,
      /(\+91[\s-]?)?(\d{5}[\s-]\d{5})/,
    ]
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        const digits = match[0].replace(/[\s-]/g, "").replace("+91", "")
        if (digits.length === 10) return digits
      }
    }
    return null
  }

  private static cleanPhone(phone: string): string {
    if (!phone) return ""
    return phone.replace(/[\s\-\(\)\+]/g, "").replace(/^91/, "")
  }

  private static extractAddress(text: string): string {
    const cleaned = text
      .replace(/\+91[\s-]?\d{10}/g, "")
      .replace(/\d{10}/g, "")
      .replace(/Rating.*?\d[\.,]?\d?/gi, "")
      .trim()
    // Clean truncation — split by words
    return cleaned.split(/\s+/).slice(0, 25).join(" ").trim()
  }

  private static extractRating(text: string): number | null {
    const match = text.match(/(\d[\.,]\d)\s*\/\s*5/)
    if (match) return parseFloat(match[1].replace(",", "."))
    const simpleMatch = text.match(/(\d[\.,]\d)/)
    if (simpleMatch) {
      const val = parseFloat(simpleMatch[1].replace(",", "."))
      if (val >= 1 && val <= 5) return val
    }
    return null
  }

  /**
   * Auto-qualification scoring for JustDial data (fewer signals available)
   *
   * Signals:
   *  - Has phone (reachable):      +30
   *  - Rating ≥ 4.0:               +25
   *  - Rating ≥ 3.0:               +15
   *  - Has website:                +20
   *  - Bonus: phone + rating≥3.5:  +10
   *
   * Thresholds: Hot ≥ 51, Warm ≥ 26, Cold < 26
   */
  private static calculateJustDialScore(signals: {
    rating: number | null
    phone: string | null
    website: string | null
  }): number {
    let score = 0
    if (signals.phone && signals.phone.length >= 10) score += 30
    if (signals.rating !== null) {
      if (signals.rating >= 4.0) score += 25
      else if (signals.rating >= 3.0) score += 15
      else score += 5
    }
    if (signals.website) score += 20
    if (signals.phone && signals.rating !== null && signals.rating >= 3.5) score += 10
    return Math.min(score, 100)
  }

  private static scoreToPriority(score: number): "hot" | "warm" | "cold" {
    if (score >= 51) return "hot"
    if (score >= 26) return "warm"
    return "cold"
  }
}
