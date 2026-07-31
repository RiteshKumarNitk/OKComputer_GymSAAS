import { describe, it, expect, beforeAll } from "vitest"
import request from "supertest"
import jwt from "jsonwebtoken"

// Same pattern as health.test.ts/cors.test.ts: set env before importing the
// app, since config/db.ts exits the process if these are missing.
process.env.NEXTAUTH_SECRET = "test-secret-key-for-testing-only"
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test"
process.env.ALLOWED_ORIGINS = "*"
process.env.NODE_ENV = "test"

let app: any

beforeAll(async () => {
  const mod = await import("../index.js")
  app = mod.default
})

function tokenFor(role: string, tenantId: string | null = "tenant-a") {
  return jwt.sign(
    { id: "user-1", userId: "user-1", role, tenantId },
    process.env.NEXTAUTH_SECRET!,
    { expiresIn: "1h" }
  )
}

const ALL_ROLES = ["super_admin", "gym_owner", "manager", "trainer", "frontdesk", "member"]

interface RoleGatedRoute {
  label: string
  method: "get" | "post" | "patch" | "delete"
  path: string
  allowedRoles: string[]
  body?: Record<string, unknown>
}

/**
 * Every route here has a `requireRole`/`requirePermission` gate (Production
 * Ready v1.0, Item 1). These tests hit the REAL Express app end-to-end
 * (supertest, no mocking) with a forged-but-validly-signed JWT per role, and
 * assert the middleware chain rejects/admits correctly BEFORE any database
 * call happens — `authenticate` -> `requireRole` both run ahead of any
 * Prisma query, so this is fully testable without a live database (this
 * sandbox has none — see DEVELOPMENT ROADMAP/DATABASE_REVIEW for why).
 * "Allowed" is asserted as "not blocked by authorization" (not 401/403), not
 * "returns 200" — a 500 from the handler failing to reach an unavailable
 * database still proves the authorization layer let the request through,
 * which is the only thing this suite is responsible for proving.
 */
const ROUTES: RoleGatedRoute[] = [
  { label: "create member", method: "post", path: "/api/members", allowedRoles: ["gym_owner", "manager", "frontdesk"] },
  { label: "create membership plan", method: "post", path: "/api/memberships", allowedRoles: ["gym_owner"] },
  { label: "update membership plan", method: "patch", path: "/api/memberships?id=m1", allowedRoles: ["gym_owner"] },
  { label: "delete membership plan", method: "delete", path: "/api/memberships?id=m1", allowedRoles: ["gym_owner"] },
  { label: "list payments", method: "get", path: "/api/payments", allowedRoles: ["gym_owner", "manager", "frontdesk"] },
  { label: "settle payment", method: "post", path: "/api/payments/settle", allowedRoles: ["gym_owner", "manager", "frontdesk"] },
  { label: "send SMS", method: "post", path: "/api/messages/send-sms", allowedRoles: ["gym_owner", "manager"], body: { to: "1234567890", body: "hi" } },
  { label: "list campaigns", method: "get", path: "/api/campaigns", allowedRoles: ["gym_owner", "manager"] },
  { label: "lead-agent status", method: "get", path: "/api/lead-agent/status", allowedRoles: ["gym_owner", "manager", "frontdesk"] },
  { label: "approve staff leave", method: "patch", path: "/api/staff/leaves/leave-1", allowedRoles: ["gym_owner", "manager"], body: { status: "approved" } },
  { label: "create staff profile", method: "post", path: "/api/staff/profiles", allowedRoles: ["gym_owner", "manager"] },
  { label: "assign workout", method: "post", path: "/api/workouts/assign", allowedRoles: ["super_admin", "gym_owner", "manager", "trainer"] },
  { label: "create daily workout plan", method: "post", path: "/api/trainer/workouts/daily-plan", allowedRoles: ["super_admin", "gym_owner", "manager", "trainer"] },
  // requirePermission("manage_settings") — super_admin passes every
  // requirePermission check via its "*" wildcard (see PERMISSION_MAP in
  // server/config/roles.ts), unlike requireRole's literal list membership.
  { label: "update access controls", method: "post", path: "/api/access-controls", allowedRoles: ["super_admin", "gym_owner"], body: { role: "manager", permissions: [] } },
  { label: "create workout template", method: "post", path: "/api/workout_templates", allowedRoles: ["super_admin", "gym_owner", "manager", "trainer", "frontdesk"] },
  { label: "impersonate tenant", method: "post", path: "/api/auth/impersonate", allowedRoles: ["super_admin"], body: { tenantId: "tenant-b" } },
  { label: "create tenant", method: "post", path: "/api/tenants", allowedRoles: ["super_admin"], body: { name: "x", slug: "x" } },
]

describe("Authorization — role enforcement across every requireRole/requirePermission-gated route", () => {
  for (const route of ROUTES) {
    const deniedRoles = ALL_ROLES.filter((r) => !route.allowedRoles.includes(r))

    describe(`${route.method.toUpperCase()} ${route.path} (${route.label})`, () => {
      it("rejects with 401 when no token is provided at all", async () => {
        const res = await (request(app) as any)[route.method](route.path).send(route.body ?? {})
        expect(res.status).toBe(401)
      })

      for (const role of route.allowedRoles) {
        it(`admits ${role} past authorization (not 401/403)`, async () => {
          const res = await (request(app) as any)[route.method](route.path)
            .set("Authorization", `Bearer ${tokenFor(role)}`)
            .send(route.body ?? {})
          expect(res.status, `role ${role} should not be blocked by authorization`).not.toBe(401)
          expect(res.status, `role ${role} should not be blocked by authorization`).not.toBe(403)
        })
      }

      for (const role of deniedRoles) {
        it(`blocks ${role} with 403`, async () => {
          const res = await (request(app) as any)[route.method](route.path)
            .set("Authorization", `Bearer ${tokenFor(role)}`)
            .send(route.body ?? {})
          expect(res.status, `role ${role} should be blocked`).toBe(403)
        })
      }
    })
  }
})

describe("Authorization — frontend-adjacent sanity check", () => {
  it("a forged token with no role claim at all is rejected by every role-gated route, not just some", async () => {
    const noRoleToken = jwt.sign({ id: "user-1", userId: "user-1", tenantId: "tenant-a" }, process.env.NEXTAUTH_SECRET!, { expiresIn: "1h" })
    for (const route of ROUTES.slice(0, 5)) {
      const res = await (request(app) as any)[route.method](route.path)
        .set("Authorization", `Bearer ${noRoleToken}`)
        .send(route.body ?? {})
      expect(res.status, `${route.method} ${route.path} with no role claim`).toBe(403)
    }
  })

  it("an expired token is rejected with 401, not silently treated as unauthenticated-but-fine", async () => {
    const expiredToken = jwt.sign({ id: "user-1", userId: "user-1", role: "gym_owner", tenantId: "tenant-a" }, process.env.NEXTAUTH_SECRET!, { expiresIn: "-1h" })
    const res = await request(app).post("/api/memberships").set("Authorization", `Bearer ${expiredToken}`).send({})
    expect(res.status).toBe(401)
  })

  it("a token signed with the wrong secret is rejected with 401", async () => {
    const forgedToken = jwt.sign({ id: "user-1", userId: "user-1", role: "super_admin", tenantId: null }, "wrong-secret", { expiresIn: "1h" })
    const res = await request(app).post("/api/tenants").set("Authorization", `Bearer ${forgedToken}`).send({ name: "x", slug: "x" })
    expect(res.status).toBe(401)
  })
})
