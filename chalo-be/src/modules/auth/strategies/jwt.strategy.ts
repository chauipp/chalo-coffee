import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // Hỗ trợ cả Bearer header (REST) lẫn ?token= query param (SSE/EventSource)
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) =>
          (req?.query as Record<string, string>)?.token ?? null,
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
