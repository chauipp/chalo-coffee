import type { UserRole } from "../../constants/auth.ts";

const DEFAULT_RETURN_PATH = "/account";
const GOOGLE_START_PATH = "/auth/google/start";

export const toSafeReturnPath = (returnTo?: string | null): string => {
  if (
    !returnTo ||
    !returnTo.startsWith("/") ||
    returnTo.startsWith("//") ||
    returnTo.includes("\\")
  ) {
    return DEFAULT_RETURN_PATH;
  }

  try {
    const url = new URL(returnTo, "https://chalo.internal");
    if (url.origin !== "https://chalo.internal") return DEFAULT_RETURN_PATH;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_RETURN_PATH;
  }
};

export const buildGoogleStartUrl = (
  apiBase: string,
  returnTo?: string | null,
): string => {
  const normalizedBase = apiBase.endsWith("/") ? apiBase : `${apiBase}/`;
  const url = new URL(GOOGLE_START_PATH.replace(/^\//, ""), normalizedBase);
  url.searchParams.set("returnTo", toSafeReturnPath(returnTo));
  return url.toString();
};

export const startGoogleLogin = (
  returnTo?: string | null,
  apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api",
): void => {
  window.location.assign(buildGoogleStartUrl(apiBase, returnTo));
};

export const resolveGoogleDestination = (
  returnTo: string | null,
  role: UserRole,
): string => {
  const safeReturnTo = toSafeReturnPath(returnTo);

  if (role === "ADMIN") {
    return safeReturnTo.startsWith("/admin")
      ? safeReturnTo
      : "/admin/dashboard";
  }

  if (role === "MODERATOR") {
    return safeReturnTo.startsWith("/staff")
      ? safeReturnTo
      : "/staff/orders";
  }

  return safeReturnTo === "/account" || safeReturnTo.startsWith("/menu/")
    ? safeReturnTo
    : DEFAULT_RETURN_PATH;
};
