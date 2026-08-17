import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import { parseAllowedOrigins } from '../../config/cors';
import { AUTH_COOKIES, readRequestCookie } from '../../modules/auth/auth-cookie';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const shouldRejectCookieMutation = ({
  method,
  cookieHeader,
  origin,
  allowedOrigins,
}: {
  method: string;
  cookieHeader: string | undefined;
  origin: string | undefined;
  allowedOrigins: Set<string>;
}): boolean => {
  if (SAFE_METHODS.has(method.toUpperCase())) return false;
  const hasSessionCookie =
    !!readRequestCookie(cookieHeader, AUTH_COOKIES.access) ||
    !!readRequestCookie(cookieHeader, AUTH_COOKIES.refresh);
  if (!hasSessionCookie) return false;
  return !origin || !allowedOrigins.has(origin.replace(/\/$/, ''));
};

/** Defense-in-depth for cookie-authenticated browser mutations. */
@Injectable()
export class CsrfOriginMiddleware implements NestMiddleware {
  private readonly allowedOrigins: Set<string>;

  constructor(configService: ConfigService) {
    this.allowedOrigins = parseAllowedOrigins(
      configService.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
    );
  }

  use(req: Request, _res: Response, next: NextFunction): void {
    if (
      shouldRejectCookieMutation({
        method: req.method,
        cookieHeader: req.headers.cookie,
        origin: req.headers.origin,
        allowedOrigins: this.allowedOrigins,
      })
    ) {
      throw new ForbiddenException('Origin không hợp lệ cho phiên đăng nhập');
    }
    next();
  }
}
