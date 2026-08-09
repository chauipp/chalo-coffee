import type { AdminRouteState } from "@/utils/admin-persistence";

export interface AdminNavMatch {
  href: string;
  activePrefixes?: readonly string[];
}

export function getActiveAdminNavHref(
  pathname: string,
  items: readonly AdminNavMatch[],
): string | null {
  return (
    items
      .filter(
        ({ href, activePrefixes }) =>
          [href, ...(activePrefixes ?? [])].some(
            (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
          ),
      )
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null
  );
}

export function isAdminOverflowActive(
  pathname: string,
  primaryItems: readonly AdminNavMatch[],
  overflowItems: readonly AdminNavMatch[],
): boolean {
  return (
    getActiveAdminNavHref(pathname, primaryItems) === null &&
    getActiveAdminNavHref(pathname, overflowItems) !== null
  );
}

export function shouldRestoreAdminRoute(
  pathname: string,
  saved: AdminRouteState | null,
): AdminRouteState | null {
  if (pathname !== "/admin" || !saved || saved.pathname === "/admin") {
    return null;
  }

  return saved.pathname.startsWith("/admin") ? saved : null;
}
