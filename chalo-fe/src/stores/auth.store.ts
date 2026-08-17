import { type UserRole } from "@/constants";
import { clearAuthCookies } from "@/services/auth/auth.helper";
import { create } from "zustand"
import { createJSONStorage, persist } from 'zustand/middleware'

export interface AuthUser {
  id: string,
  username: string,
  fullName: string,
  avatar: string | null,
  role: UserRole,
  permission: string[]
}

interface AuthState {
  user: AuthUser | null,

  isHydrated: boolean,
  isInitialized: boolean,

  setUser: (user: AuthUser) => void,
  setHydrated: () => void,
  setInitialized: () => void,
  logout: () => void,

  isAuthenticated: () => boolean,
  hasPermission: (permission: string) => boolean,
  hasRole: (role: UserRole) => boolean,
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,

      isHydrated: false,
      isInitialized: false,

      setUser: (user) => {
        set({ user: user })
      },
      setHydrated: () => {
        set({ isHydrated: true })
      },
      setInitialized: () => {
        set({ isInitialized: true })
      },
      logout: () => {
        set({ user: null, isInitialized: false })
        if (typeof document !== 'undefined') {
          clearAuthCookies()
        }
      },

      isAuthenticated: () => {
        const { user, isHydrated } = get()
        return isHydrated && !!user
      },
      hasPermission: (permission: string) => {
        const { user } = get()
        return user?.permission.includes(permission) ?? false
      },
      hasRole: (role: UserRole) =>
        get().user?.role === role,
    }),
    {
      name: 'chalo-auth',
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        user: state.user
      }),

      onRehydrateStorage: () => (state) => { state?.setHydrated() }
    }
  )
)
