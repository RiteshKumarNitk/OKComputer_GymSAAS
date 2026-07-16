import { describe, it, expect } from "vitest"
import request from "supertest"

process.env.NEXTAUTH_SECRET = "test-secret-key-for-testing-only"
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test"
process.env.ALLOWED_ORIGINS = "http://localhost:5173"
process.env.NODE_ENV = "test"

describe("API CORS & Auth", () => {
  it("should block unauthorized origins", async () => {
    const { default: app } = await import("../index.js")
    
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "https://evil-site.com")
    
    expect(res.status).toBe(500) // CORS error
  })

  it("should require authentication for protected routes", async () => {
    const { default: app } = await import("../index.js")
    
    const res = await request(app).get("/api/members")
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty("error", "Authentication required")
  })

  it("should allow requests with valid origin", async () => {
    const { default: app } = await import("../index.js")
    
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "http://localhost:5173")
    
    expect(res.status).toBe(200)
  })
})
