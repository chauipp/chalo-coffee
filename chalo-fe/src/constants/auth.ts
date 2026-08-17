// src/constants/auth.ts

export const TOKEN_KEYS = {
  ACCESS: 'chalo_access',
  REFRESH: 'chalo_refresh',
  ROLE: 'chalo_role',
} as const

export const USER_ROLE = {
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  CUSTOMER: 'CUSTOMER',
} as const

export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE]

export const COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'Strict' as const,
  maxAge: 7 * 24 * 60 * 60,
}
