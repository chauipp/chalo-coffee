import { ROUTES } from "@/constants"
import { userLogout } from "@/services/auth/auth.api"
import { useAuthStore } from "@/stores/auth.store"

// src/hooks/useLogout.ts
export const useLogout = () => {
  const { logout } = useAuthStore()

  return async () => {
    try { await userLogout() } catch { }
    logout()
    // Hard navigation thay cho router.push (soft-nav): buộc tải lại toàn trang nên
    // middleware chạy lại với cookie đã xoá và toàn bộ state bị reset. Tránh được
    // Router Cache/prefetch cũ của /login (đã bị middleware redirect về app khi còn
    // đăng nhập) khiến đôi lúc phải refresh thủ công mới ra được trang đăng nhập.
    if (typeof window !== "undefined") {
      window.location.assign(ROUTES.LOGIN)
    }
  }
}