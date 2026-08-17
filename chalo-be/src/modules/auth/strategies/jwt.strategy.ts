import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { AUTH_COOKIES, readRequestCookie } from '../auth-cookie';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // Browser dùng HttpOnly cookie; Bearer vẫn giữ cho Swagger/CLI.
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => readRequestCookie(req?.headers.cookie, AUTH_COOKIES.access) ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') as string,
    });
  }

  validate(payload: { sub: number; username: string; role: string }) {
    return {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }
}
