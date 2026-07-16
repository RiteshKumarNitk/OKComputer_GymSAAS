import { describe, it, expect } from "vitest"
import request from "supertest"

// We need to build the app without starting the server.
// We'll import the app but need to handle the fact that config/db.ts
// exits the process if JWT_SECRET is missing. For tests, we set it.
process.env.NEXTAUTH_SECRET = "test-secret-key-for-testing-only"
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test"
process.env.ALLOWED_ORIGINS = "*"
process.env.NODE_ENV = "test"

describe("API Health Check", () => {
  it("GET /api/health should return 200 with status ok", async () => {
    // Dynamic import so env vars are set before module loads
    const { default: app } = await import("../index.js")
    
    const res = await request(app).get("/api/health")
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty("status", "ok")
    expect(res.body).toHaveProperty("timestamp")
    expect(res.body).toHaveProperty("uptime")
    expect(res.body).toHaveProperty("environment")
  })

  it("GET /api/health should return valid JSON", async () => {
    const { default: app } = await import("../index.js")
    
    const res = await request(app).get("/api/health")
    expect(res.headers["content-type"]).toMatch(/json/)
    expect(res.body.status).toBe("ok")
  })
})
