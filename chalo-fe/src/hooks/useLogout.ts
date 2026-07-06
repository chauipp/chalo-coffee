import { ROUTES } from "@/constants"
import { userLogout } from "@/services/auth/auth.api"
import { useAuthStore } from "@/stores/auth.store"
import { useRouter } from "next/navigation"

// src/hooks/useLogout.ts
export const useLogout = () => {
  const { logout } = useAuthStore()
  const router = useRouter()

  return async () => {
    try { await userLogout() } catch { }
    logout()
    router.push(ROUTES.LOGIN)
  }
}