import React, { createContext, useContext, useEffect, useState } from "react"
import type { AuthUser, UserRole } from "@/types"

interface AuthContextType {
  user: AuthUser | null
  session: any | null
  isLoading: boolean
  tenantFeatures: string[] | null
  signIn: (email: string, password: string) => Promise<void>
  sendOtp: (phone: string) => Promise<void>
  verifyOtp: (phone: string, otp: string) => Promise<void>
  signInWithPhone: (phone: string, idToken: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string, role?: string, tenantId?: string) => Promise<void>
  signOut: () => Promise<void>
  hasRole: (roles: readonly UserRole[]) => boolean
  hasPermission: (permission: string) => boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tenantFeatures] = useState<string[] | null>(null)

  // Check session on mount
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const res = await fetch("/api/auth/session")
      const data = await res.json()
      if (data?.user) {
        setSession(data)
        setUser({
          id: data.user.id || data.user.sub,
          email: data.user.email,
          role: (data.user.role || "member") as UserRole,
          tenantId: data.user.tenantId || null,
          fullName: data.user.name || null,
        })
      } else {
        // Try localStorage fallback for Vite SPA
        const stored = localStorage.getItem("gym_user")
        if (stored) {
          const parsed = JSON.parse(stored)
          setUser(parsed)
          setSession({ user: parsed })
        }
      }
    } catch {
      // Try localStorage fallback
      const stored = localStorage.getItem("gym_user")
      if (stored) {
        const parsed = JSON.parse(stored)
        setUser(parsed)
        setSession({ user: parsed })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Login failed" }))
      throw new Error(err.error || "Invalid credentials")
    }

    const data = await res.json()
const authUser: AuthUser = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role as UserRole,
      tenantId: data.user.tenantId,
      fullName: data.user.fullName,
    }
    setUser(authUser)
    setSession({ user: data.user, token: data.token })
    localStorage.setItem("gym_user", JSON.stringify(authUser))
    localStorage.setItem("gym_token", data.token)
  }

  const signInWithPhone = async (phone: string, idToken: string) => {
    const res = await fetch("/api/auth/phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, idToken }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Phone login failed" }))
      throw new Error(err.error || "Invalid phone number or token")
    }

    const data = await res.json()
    const authUser: AuthUser = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role as UserRole,
      tenantId: data.user.tenantId,
      fullName: data.user.fullName,
    }
    setUser(authUser)
    setSession({ user: data.user, token: data.token })
    localStorage.setItem("gym_user", JSON.stringify(authUser))
    localStorage.setItem("gym_token", data.token)
  }

  const sendOtp = async (phone: string) => {
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to send OTP" }))
      throw new Error(err.error || "Failed to send OTP. Please try again.")
    }
  }

  const verifyOtp = async (phone: string, otp: string) => {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Verification failed" }))
      throw new Error(err.error || "Invalid OTP")
    }

    const data = await res.json()
    const authUser: AuthUser = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role as UserRole,
      tenantId: data.user.tenantId,
      fullName: data.user.fullName,
    }
    setUser(authUser)
    setSession({ user: data.user, token: data.token })
    localStorage.setItem("gym_user", JSON.stringify(authUser))
    localStorage.setItem("gym_token", data.token)
  }

  const signUp = async (email: string, password: string, fullName: string, role?: string, tenantId?: string) => {
    const token = session?.token || localStorage.getItem("gym_token")
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ email, password, fullName, role, tenantId }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Registration failed")
    }
  }

  const signOut = async () => {
    localStorage.removeItem("gym_user")
    localStorage.removeItem("gym_token")
    setUser(null)
    setSession(null)
    try { await fetch("/api/auth/signout", { method: "POST" }) } catch { }
  }

  const hasRole = (roles: readonly UserRole[]): boolean => {
    if (!user) return false
    return roles.includes(user.role)
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false

    const permissions: Record<UserRole, string[]> = {
      super_admin: ["*"],
      gym_owner: ["view_dashboard", "manage_members", "manage_trainers", "manage_billing", "view_analytics", "manage_settings"],
      manager: ["view_dashboard", "manage_members", "manage_trainers", "view_billing", "view_analytics"],
      trainer: ["view_dashboard", "view_members", "manage_workouts", "manage_diet_plans", "view_schedule"],
      frontdesk: ["view_dashboard", "view_members", "manage_attendance", "view_payments"],
      member: ["view_own_profile", "view_own_workouts", "view_own_diet_plans", "view_attendance"],
    }

    const userPermissions = permissions[user.role] || []
    return userPermissions.includes("*") || userPermissions.includes(permission)
  }

  const refreshUser = async () => {
    await checkSession()
  }

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    tenantFeatures,
    signIn,
    sendOtp,
    verifyOtp,
    signInWithPhone,
    signUp,
    signOut,
    hasRole,
    hasPermission,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}