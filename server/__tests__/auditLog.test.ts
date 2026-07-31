import { describe, it, expect } from "vitest"
import { sanitizeChanges, resolveAuditAction, extractResourceId } from "../lib/auditLog.js"

describe("sanitizeChanges", () => {
  it("strips passwordHash and QR token fields", () => {
    const result = sanitizeChanges({ email: "a@b.com", passwordHash: "secret", fullName: "A" })
    expect(result).toEqual({ email: "a@b.com", fullName: "A" })
    expect(result).not.toHaveProperty("passwordHash")
  })

  it("strips qrToken and qrTokenExpiresAt", () => {
    const result = sanitizeChanges({ status: "active", qrToken: "abc123", qrTokenExpiresAt: new Date() })
    expect(result).toEqual({ status: "active" })
  })

  it("returns null for non-object input (e.g. undefined data on a delete call)", () => {
    expect(sanitizeChanges(undefined)).toBeNull()
    expect(sanitizeChanges(null)).toBeNull()
    expect(sanitizeChanges("not an object")).toBeNull()
    expect(sanitizeChanges([1, 2, 3])).toBeNull()
  })

  it("passes through an already-clean object unchanged in content", () => {
    const input = { name: "Gold Plan", priceCents: 100000 }
    expect(sanitizeChanges(input)).toEqual(input)
  })
})

describe("resolveAuditAction", () => {
  it("names a generic create/update/delete action from model + operation", () => {
    expect(resolveAuditAction("Member", "create")).toBe("member_create")
    expect(resolveAuditAction("Payment", "update")).toBe("payment_update")
    expect(resolveAuditAction("Tenant", "delete")).toBe("tenant_delete")
  })

  it("normalizes the *Many operation suffix", () => {
    expect(resolveAuditAction("Member", "updateMany")).toBe("member_update")
    expect(resolveAuditAction("Member", "deleteMany")).toBe("member_delete")
  })

  it("calls out UserProfile role changes specifically instead of a generic update", () => {
    expect(resolveAuditAction("UserProfile", "update", { role: "manager" })).toBe("role_changed")
  })

  it("does not misfire role_changed for a UserProfile update that doesn't touch role", () => {
    expect(resolveAuditAction("UserProfile", "update", { fullName: "New Name" })).toBe("userprofile_update")
  })

  it("does not misfire role_changed for a non-UserProfile model that happens to have a role-like field", () => {
    expect(resolveAuditAction("Member", "update", { role: "member" })).toBe("member_update")
  })
})

describe("extractResourceId", () => {
  it("prefers the mutation result's own id (e.g. after a create)", () => {
    expect(extractResourceId(undefined, { id: "new-id", name: "X" })).toBe("new-id")
  })

  it("falls back to the where clause's id when the result has none (e.g. a deleteMany count result)", () => {
    expect(extractResourceId({ where: { id: "target-id" } }, { count: 1 })).toBe("target-id")
  })

  it("returns null when neither is available", () => {
    expect(extractResourceId(undefined, { count: 0 })).toBeNull()
    expect(extractResourceId({ where: {} }, null)).toBeNull()
  })

  it("prefers the result id over the where id when both are present", () => {
    expect(extractResourceId({ where: { id: "where-id" } }, { id: "result-id" })).toBe("result-id")
  })
})
