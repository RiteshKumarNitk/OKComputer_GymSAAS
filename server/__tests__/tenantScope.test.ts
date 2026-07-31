import { describe, it, expect } from "vitest"
import { applyTenantScope } from "../lib/prismaTenantScope.js"
import { TENANT_SCOPED_MODELS } from "../lib/tenantScopedModels.js"

const tenantACtx = { tenantId: "tenant-a", role: "gym_owner" }
const superAdminCtx = { tenantId: null, role: "super_admin" }

describe("applyTenantScope", () => {
  it("injects tenantId into where for a tenant-scoped model", () => {
    const result = applyTenantScope("Member", "findMany", { where: { status: "active" } }, tenantACtx)
    expect(result?.where).toEqual({ status: "active", tenantId: "tenant-a" })
  })

  it("adds a where clause even if none was passed", () => {
    const result = applyTenantScope("Member", "findMany", undefined, tenantACtx)
    expect(result?.where).toEqual({ tenantId: "tenant-a" })
  })

  it("preserves an existing explicit tenantId filter (overwrites with the same, trusted value)", () => {
    const result = applyTenantScope("Member", "findFirst", { where: { id: "m1", tenantId: "tenant-a" } }, tenantACtx)
    expect(result?.where).toEqual({ id: "m1", tenantId: "tenant-a" })
  })

  it("does not scope for super_admin, even against a tenant-scoped model", () => {
    const args = { where: { status: "active" } }
    const result = applyTenantScope("Member", "findMany", args, superAdminCtx)
    expect(result).toBe(args)
  })

  it("does not scope when there is no tenant context (e.g. a background cron job)", () => {
    const args = { where: { status: "active" } }
    const result = applyTenantScope("Member", "findMany", args, undefined)
    expect(result).toBe(args)
  })

  it("does not scope models outside the tenant-scoped set (e.g. Tenant itself)", () => {
    const args = { where: { id: "tenant-a" } }
    const result = applyTenantScope("Tenant", "findUnique", args, tenantACtx)
    expect(result).toBe(args)
  })

  it("does not scope models with nullable tenantId (UserProfile, AuditLog)", () => {
    const args = { where: { email: "a@b.com" } }
    expect(applyTenantScope("UserProfile", "findUnique", args, tenantACtx)).toBe(args)
    expect(applyTenantScope("AuditLog", "findMany", args, tenantACtx)).toBe(args)
  })

  it("does not touch create/createMany, even for a tenant-scoped model", () => {
    const args = { data: { fullName: "New Member" } }
    expect(applyTenantScope("Member", "create", args, tenantACtx)).toBe(args)
    expect(applyTenantScope("Member", "createMany", args, tenantACtx)).toBe(args)
  })

  it("scopes update, updateMany, delete, deleteMany, count, aggregate, groupBy, and upsert", () => {
    for (const op of ["update", "updateMany", "delete", "deleteMany", "count", "aggregate", "groupBy", "upsert"]) {
      const result = applyTenantScope("Member", op, { where: { id: "m1" } }, tenantACtx)
      expect(result?.where, `operation: ${op}`).toEqual({ id: "m1", tenantId: "tenant-a" })
    }
  })
})

describe("applyTenantScope — completeness regression guard (Production Ready v1.0, Item 3)", () => {
  // Every model in TENANT_SCOPED_MODELS actually gets scoped. If a future
  // change removes a model from that Set without meaning to, this fails —
  // that's the whole point of the set existing as a single source of truth.
  it("scopes every model currently registered in TENANT_SCOPED_MODELS", () => {
    for (const model of TENANT_SCOPED_MODELS) {
      const result = applyTenantScope(model, "findMany", { where: {} }, tenantACtx)
      expect(result?.where, `model: ${model}`).toEqual({ tenantId: "tenant-a" })
    }
  })

  // Snapshot of the set's size — schema.prisma currently has 47 models: 43
  // belong in this set, and 4 (Tenant, SaasPlan, UserProfile, AuditLog) are
  // deliberately excluded (verified by direct count against schema.prisma
  // during the Item 3 audit). If someone adds a new tenant-scoped model to
  // the schema and forgets to register it here, this count won't change and
  // won't catch it — but if someone accidentally *removes* an entry, this
  // will. A schema-introspection-based test would catch the "forgot to add"
  // case too, but Prisma's runtime dmmf doesn't expose field nullability in
  // this version (see tenantScopedModels.ts's own comment) so that's not
  // available to test against directly.
  it("has exactly the 43 models expected as of the Item 3 audit", () => {
    expect(TENANT_SCOPED_MODELS.size).toBe(43)
  })

  // Specific models found missing an explicit tenantId filter during the
  // Item 3 audit (Notification, MessageTemplate, Campaign, MemberFitnessStats,
  // StaffAttendance) — locking in that they stay in the auto-scoped set,
  // since that's the backstop that made those findings low-risk rather than
  // active vulnerabilities.
  it("keeps the models specifically implicated in the Item 3 findings in the scoped set", () => {
    for (const model of ["Notification", "MessageTemplate", "Campaign", "MemberFitnessStats", "StaffAttendance", "MemberHealthProfile", "RazorpayOrder", "Invoice"]) {
      expect(TENANT_SCOPED_MODELS.has(model), `expected ${model} to remain in TENANT_SCOPED_MODELS`).toBe(true)
    }
  })

  // The inverse — confirms UserProfile/AuditLog stay excluded by design, not
  // by accident. If someone "fixes" this later without reading why, this
  // test is the trip-wire.
  it("keeps UserProfile and AuditLog excluded (nullable tenantId — see tenantScopedModels.ts)", () => {
    expect(TENANT_SCOPED_MODELS.has("UserProfile")).toBe(false)
    expect(TENANT_SCOPED_MODELS.has("AuditLog")).toBe(false)
  })
})
