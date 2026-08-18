import type { CookieOptions, Response } from 'express';
import { UserRole } from '../../common/enums/user-role.enum';

export const AUTH_COOKIES = {
  access: 'chalo_access',
  refresh: 'chalo_refresh',
  role: 'chalo_role',
} as const;

type TokenPair = { accessToken: string; refreshToken: string };

const sharedOptions = (production: boolean): CookieOptions => ({
  httpOnly: true,
  secure: production,
  sameSite: 'strict',
});

/** Browser cookie is intentionally the only store for credentials. */
export const setAuthCookies = (
  response: Pick<Response, 'cookie'>,
  tokens: TokenPair,
  role: UserRole,
  production: boolean,
): void => {
  response.cookie(AUTH_COOKIES.access, tokens.accessToken, {
    ...sharedOptions(production),
    path: '/',
    maxAge: 15 * 60 * 1000,
  });
  response.cookie(AUTH_COOKIES.refresh, tokens.refreshToken, {
    ...sharedOptions(production),
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  response.cookie(AUTH_COOKIES.role, role, {
    httpOnly: false,
    secure: production,
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearAuthCookies = (
  response: Pick<Response, 'clearCookie'>,
  production: boolean,
): void => {
  response.clearCookie(AUTH_COOKIES.access, { ...sharedOptions(production), path: '/' });
  response.clearCookie(AUTH_COOKIES.refresh, { ...sharedOptions(production), path: '/api/auth' });
  response.clearCookie(AUTH_COOKIES.role, {
    httpOnly: false,
    secure: production,
    sameSite: 'strict',
    path: '/',
  });
};

/** Express does not parse cookies unless cookie-parser is registered. */
export const readRequestCookie = (
  cookieHeader: string | undefined,
  name: string,
): string | undefined => {
  if (!cookieHeader) return undefined;
  const prefix = `${name}=`;
  const entry = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
  if (!entry) return undefined;
  try {
    return decodeURIComponent(entry.slice(prefix.length));
  } catch {
    return undefined;
  }
};
