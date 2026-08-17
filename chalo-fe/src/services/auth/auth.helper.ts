import { COOKIE_OPTIONS, TOKEN_KEYS } from "@/constants";

export const clearAuthCookies = ():void => {
    if (typeof document === 'undefined') return
    const opts = `path=${COOKIE_OPTIONS.path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    // Access/refresh là HttpOnly cookie do backend xoá qua /auth/logout.
    document.cookie = `${TOKEN_KEYS.ROLE}=; ${opts}`
}
