'use client'
import { UserRole } from "@/constants"
import { AuthUser, useAuthStore } from "@/stores/auth.store"
import { ReactNode } from "react"

export const useHasPermission = (p: string): boolean => {
  const userPermission = useAuthStore(s => s.user?.permission)
  return userPermission?.includes(p) ?? false
}

export const useHasAnyPermission = (ps: string[]): boolean => {
  const userPermission = useAuthStore(s => s.user?.permission)
  if (!userPermission) return false
  return ps.some(p => userPermission.includes(p))
}

export const useHasRole = (r: UserRole): boolean => {
  const userRole = useAuthStore(s => s.user?.role)
  return userRole === r
}

export const useCurrentUser = (): AuthUser | null => {
  return useAuthStore(s => s.user)
}

export const useIsAuthenticated = (): boolean => {
  return useAuthStore(s => s.isHydrated && !!s.accessToken)
}

export const PermissionGuard = ({
  permission,
  children,
  fallback = null
}: {
  permission: string,
  children: ReactNode,
  fallback?: ReactNode
}) => {
  const ok = useHasPermission(permission)
  return ok ? children : fallback
}

export const RoleGuard = ({
  role,
  children,
  fallback
}: {
  role: UserRole,
  children: ReactNode,
  fallback: ReactNode
}) => {
  const ok = useHasRole(role)
  return ok ? children : fallback
}