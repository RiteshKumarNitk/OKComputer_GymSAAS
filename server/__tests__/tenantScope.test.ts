import { describe, it, expect } from "vitest"
import { applyTenantScope } from "../lib/prismaTenantScope.js"

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
