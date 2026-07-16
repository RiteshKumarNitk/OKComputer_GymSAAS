import { describe, it, expect, vi } from "vitest"
import type { Request, Response } from "express"
import { requireRole } from "../middleware/requireRole.js"
import { requirePermission } from "../middleware/requirePermission.js"

function mockReqRes(role: string | undefined) {
  const req = { role } as unknown as Request
  const json = vi.fn()
  const status = vi.fn(() => ({ json }))
  const res = { status } as unknown as Response
  const next = vi.fn()
  return { req, res, next, status, json }
}

describe("requireRole", () => {
  it("calls next() when the caller's role is in the allowed list", () => {
    const { req, res, next } = mockReqRes("gym_owner")
    requireRole("gym_owner", "manager")(req, res, next)
    expect(next).toHaveBeenCalledOnce()
  })

  it("returns 403 when the caller's role is not in the allowed list", () => {
    const { req, res, next, status, json } = mockReqRes("frontdesk")
    requireRole("gym_owner", "manager")(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(status).toHaveBeenCalledWith(403)
    expect(json).toHaveBeenCalledWith({ error: "Access denied." })
  })

  it("returns 403 when req.role is missing entirely (authenticate didn't run, or token had no role)", () => {
    const { req, res, next, status } = mockReqRes(undefined)
    requireRole("gym_owner")(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(status).toHaveBeenCalledWith(403)
  })

  it("supports a single-role gate (e.g. super_admin-only routes)", () => {
    const allowed = mockReqRes("super_admin")
    requireRole("super_admin")(allowed.req, allowed.res, allowed.next)
    expect(allowed.next).toHaveBeenCalledOnce()

    const denied = mockReqRes("gym_owner")
    requireRole("super_admin")(denied.req, denied.res, denied.next)
    expect(denied.next).not.toHaveBeenCalled()
  })
})

describe("requirePermission", () => {
  it("calls next() when the caller's role holds the required permission", () => {
    const { req, res, next } = mockReqRes("gym_owner")
    requirePermission("manage_settings")(req, res, next)
    expect(next).toHaveBeenCalledOnce()
  })

  it("returns 403 when the caller's role lacks the required permission", () => {
    const { req, res, next, status } = mockReqRes("trainer")
    requirePermission("manage_settings")(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(status).toHaveBeenCalledWith(403)
  })

  it("passes if the caller's role holds ANY of multiple listed permissions", () => {
    const { req, res, next } = mockReqRes("frontdesk")
    requirePermission("manage_settings", "view_payments")(req, res, next)
    expect(next).toHaveBeenCalledOnce()
  })

  it("super_admin's wildcard permission passes every check", () => {
    const { req, res, next } = mockReqRes("super_admin")
    requirePermission("manage_settings")(req, res, next)
    expect(next).toHaveBeenCalledOnce()
  })

  it("member (no permissions at all) is denied everything", () => {
    const { req, res, next, status } = mockReqRes("member")
    requirePermission("view_dashboard")(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(status).toHaveBeenCalledWith(403)
  })

  it("returns 403 when req.role is missing", () => {
    const { req, res, next } = mockReqRes(undefined)
    requirePermission("view_dashboard")(req, res, next)
    expect(next).not.toHaveBeenCalled()
  })
})
