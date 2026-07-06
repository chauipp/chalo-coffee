import { COOKIE_OPTIONS, TOKEN_KEYS, UserRole } from "@/constants";

export const persistAuthCookies = (accessToken: string, role: UserRole):void => {
    if (typeof document === 'undefined') return
    const opts = `path=${COOKIE_OPTIONS.path}; SameSite=${COOKIE_OPTIONS.sameSite}`
    document.cookie = `${TOKEN_KEYS.ACCESS}=${accessToken}; ${opts}`
    document.cookie = `${TOKEN_KEYS.ROLE}=${role}; ${opts}`
}

export const clearAuthCookies = ():void => {
    if (typeof document === 'undefined') return
    const opts = `path=${COOKIE_OPTIONS.path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    document.cookie = `${TOKEN_KEYS.ACCESS}=; ${opts}`
    document.cookie = `${TOKEN_KEYS.REFRESH}=; ${opts}`
    document.cookie = `${TOKEN_KEYS.ROLE}=; ${opts}`
}