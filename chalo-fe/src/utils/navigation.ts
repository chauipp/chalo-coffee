// src/utils/navigation.ts

import { ROLE_DEFAULT_ROUTES, ROUTES, UserRole } from "@/constants"

export const getSafeRedirectUrl = (
    redirectUrl: string | null,
    role: UserRole
):string => {
    const defaultRedirectUrl = ROLE_DEFAULT_ROUTES[role] ?? ROUTES.DASHBOARD

    if (!redirectUrl) return defaultRedirectUrl

    try {
        const url = new URL(redirectUrl, window.location.origin)
        if(url.origin === window.location.origin){
            return redirectUrl
        }
    } catch {
        
    }

    return defaultRedirectUrl
}