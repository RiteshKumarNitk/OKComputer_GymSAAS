import React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "./AuthContext"
import type { UserRole } from "@/types"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: readonly UserRole[]
  requiredPermission?: string
  redirectTo?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  requiredPermission,
  redirectTo = "/signin",
}) => {
  const { user, isLoading, hasRole, hasPermission } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return <Navigate to="/unauthorized" replace />
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

// Role-specific route components
export const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={["super_admin"]}>{children}</ProtectedRoute>
)

export const GymOwnerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={["gym_owner", "super_admin"]}>{children}</ProtectedRoute>
)

export const ManagerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={["manager", "gym_owner", "super_admin"]}>
    {children}
  </ProtectedRoute>
)

export const TrainerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={["trainer", "manager", "gym_owner", "super_admin"]}>
    {children}
  </ProtectedRoute>
)

export const FrontdeskRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute
    requiredRoles={["frontdesk", "trainer", "manager", "gym_owner", "super_admin"]}
  >
    {children}
  </ProtectedRoute>
)

// Permission-based route
export const PermissionRoute: React.FC<{
  children: React.ReactNode
  permission: string
}> = ({ children, permission }) => (
  <ProtectedRoute requiredPermission={permission}>{children}</ProtectedRoute>
)