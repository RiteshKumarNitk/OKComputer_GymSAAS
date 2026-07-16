/**
 * Centralized Role & Permission Constants
 * 
 * Single source of truth for all user roles and their permissions.
 * Import this file instead of hardcoding role strings everywhere.
 */

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  GYM_OWNER: "gym_owner",
  MANAGER: "manager",
  TRAINER: "trainer",
  FRONTDESK: "frontdesk",
  MEMBER: "member",
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

/** All roles ordered by hierarchy (highest to lowest) */
export const ROLE_HIERARCHY: UserRole[] = [
  ROLES.SUPER_ADMIN,
  ROLES.GYM_OWNER,
  ROLES.MANAGER,
  ROLES.TRAINER,
  ROLES.FRONTDESK,
  ROLES.MEMBER,
]

/** Roles that have full CRUD access to gym operations */
export const ADMIN_ROLES: UserRole[] = [
  ROLES.SUPER_ADMIN,
  ROLES.GYM_OWNER,
  ROLES.MANAGER,
]

/** Roles that can manage attendance */
export const ATTENDANCE_ROLES: UserRole[] = [
  ROLES.GYM_OWNER,
  ROLES.MANAGER,
  ROLES.FRONTDESK,
]

/** Roles that can manage members */
export const MEMBER_MGMT_ROLES: UserRole[] = [
  ROLES.GYM_OWNER,
  ROLES.MANAGER,
  ROLES.FRONTDESK,
]

/** Roles that can perform destructive actions (delete) */
export const DELETE_ROLES: UserRole[] = [
  ROLES.SUPER_ADMIN,
  ROLES.GYM_OWNER,
]

/** Default roles allowed for mutation operations in generic CRUD */
export const DEFAULT_MUTATION_ROLES: UserRole[] = [
  ROLES.GYM_OWNER,
  ROLES.MANAGER,
]

/** Default roles allowed for list operations in generic CRUD */
export const DEFAULT_LIST_ROLES: UserRole[] = [
  ROLES.GYM_OWNER,
  ROLES.MANAGER,
  ROLES.FRONTDESK,
  ROLES.TRAINER,
]

/** Roles that can create user accounts */
export const ACCOUNT_CREATION_ROLES: Record<UserRole, UserRole[]> = {
  [ROLES.SUPER_ADMIN]: [ROLES.SUPER_ADMIN, ROLES.GYM_OWNER, ROLES.MANAGER, ROLES.TRAINER, ROLES.FRONTDESK],
  [ROLES.GYM_OWNER]: [ROLES.MANAGER, ROLES.TRAINER, ROLES.FRONTDESK],
  [ROLES.MANAGER]: [],
  [ROLES.TRAINER]: [],
  [ROLES.FRONTDESK]: [],
  [ROLES.MEMBER]: [],
}

/**
 * Check if a user role has sufficient privileges for an action
 */
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole)
}

/**
 * Check if a user role is at least as high as the minimum required role
 */
export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  const userIdx = ROLE_HIERARCHY.indexOf(userRole)
  const minIdx = ROLE_HIERARCHY.indexOf(minRole)
  if (userIdx === -1 || minIdx === -1) return false
  return userIdx <= minIdx
}

/**
 * Permission strings per role — the backend source of truth. Mirrors
 * src/features/auth/AuthContext.tsx's hasPermission map (frontend and
 * backend can't share a bundle in this codebase, so this is a deliberate,
 * documented duplication — keep the two in sync when either changes).
 * "*" means every permission (super_admin only).
 */
export const PERMISSION_MAP: Record<UserRole, string[]> = {
  [ROLES.SUPER_ADMIN]: ["*"],
  [ROLES.GYM_OWNER]: ["view_dashboard", "manage_members", "manage_trainers", "manage_billing", "view_analytics", "manage_settings"],
  [ROLES.MANAGER]: ["view_dashboard", "manage_members", "manage_trainers", "view_billing", "view_analytics"],
  [ROLES.TRAINER]: ["view_dashboard", "view_members", "manage_workouts", "manage_diet_plans", "view_schedule"],
  [ROLES.FRONTDESK]: ["view_dashboard", "view_members", "manage_attendance", "view_payments"],
  [ROLES.MEMBER]: [],
}

/**
 * Check if a role has a given permission (or holds the "*" wildcard).
 */
export function hasPermission(userRole: UserRole, permission: string): boolean {
  const perms = PERMISSION_MAP[userRole] || []
  return perms.includes("*") || perms.includes(permission)
}
