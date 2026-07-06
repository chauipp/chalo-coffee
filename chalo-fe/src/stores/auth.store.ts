import { type UserRole } from "@/constants";
import { clearAuthCookies, persistAuthCookies } from "@/services/auth/auth.helper";
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
  accessToken: string | null,
  refreshToken: string | null,
  user: AuthUser | null,

  isHydrated: boolean,
  isInitialized: boolean,

  setTokens: (accessToken: string, refreshToken: string) => void,
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
      accessToken: null,
      refreshToken: null,
      user: null,

      isHydrated: false,
      isInitialized: false,

      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken })
        if(typeof document !== 'undefined' && get().user){
          persistAuthCookies(accessToken, get().user!.role)
        }
      },
      setUser: (user) => {
        set({ user: user })
        const token = get().accessToken
        if (typeof document !== 'undefined' && token) {
          persistAuthCookies(token, user.role)
        }
      },
      setHydrated: () => {
        set({ isHydrated: true })
      },
      setInitialized: () => {
        set({ isInitialized: true })
      },
      logout: () => {
        set({ accessToken: null, refreshToken: null, user: null, isInitialized: false })
        if (typeof document !== 'undefined') {
          clearAuthCookies()
        }
      },

      isAuthenticated: () => {
        const { accessToken, isHydrated } = get()
        return isHydrated && !!accessToken
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
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user
      }),

      onRehydrateStorage: () => (state) => { state?.setHydrated() }
    }
  )
)