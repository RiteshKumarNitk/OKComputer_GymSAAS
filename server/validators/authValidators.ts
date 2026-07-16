import { z } from "zod"

/**
 * Zod validation schemas for authentication endpoints
 */

export const loginSchema = z.object({
  email: z.string().email("Invalid email format").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128, "Password too long"),
})

export const registerSchema = z.object({
  email: z.string().email("Invalid email format").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128, "Password too long"),
  fullName: z.string().min(1, "Full name is required").max(100, "Name too long"),
  role: z.enum(["super_admin", "gym_owner", "manager", "trainer", "frontdesk", "member"]).optional(),
  tenantId: z.string().uuid("Invalid tenant ID").optional(),
})

export const setupAdminSchema = z.object({
  email: z.string().email("Invalid email format").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128, "Password too long"),
  fullName: z.string().min(1, "Full name is required").max(100, "Name too long"),
})

export const phoneAuthSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
  phone: z.string().optional(),
})

export const sendOtpSchema = z.object({
  phone: z.string().regex(/^(\+)?\d{10,15}$/, "Invalid phone number format"),
})

export const verifyOtpSchema = z.object({
  phone: z.string().min(1, "Phone is required"),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must be numeric"),
})
