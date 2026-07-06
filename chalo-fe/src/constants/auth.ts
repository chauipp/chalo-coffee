// src/constants/auth.ts

export const TOKEN_KEYS = {
  ACCESS: 'ACCESS_TOKEN',
  REFRESH: 'REFRESH_TOKEN',
  ROLE: 'USER_ROLE',
} as const

export const USER_ROLE = {
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  CUSTOMER: 'CUSTOMER',
} as const

export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE]

export const COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'Strict' as const
}