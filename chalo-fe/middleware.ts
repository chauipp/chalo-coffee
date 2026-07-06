import { PUBLIC_ROUTES, ROLE_DEFAULT_ROUTES, ROUTES, TOKEN_KEYS, USER_ROLE } from "@/constants"
import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(TOKEN_KEYS.ACCESS)?.value
  const role = request.cookies.get(TOKEN_KEYS.ROLE)?.value

  if (pathname.startsWith(ROUTES.MENU)) {
    return NextResponse.next()
  }

  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    if (token && role) {
      const dest = ROLE_DEFAULT_ROUTES[role] ?? ROUTES.LOGIN
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return NextResponse.next()
  }

  if (pathname.startsWith(ROUTES.ADMIN.ROOT) || pathname.startsWith(ROUTES.STAFF.ROOT)) {
    if (!token) {
      const url = new URL(ROUTES.LOGIN, request.url)
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
    if (pathname.startsWith(ROUTES.ADMIN.ROOT) && role !== USER_ROLE.ADMIN) {
      return NextResponse.redirect(new URL(ROUTES.STAFF.ORDERS, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|mockServiceWorker.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}