import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from '../user/user.module';
import { GoogleOAuthController } from './google-oauth.controller';
import {
  GOOGLE_OAUTH_PROVIDER,
  GoogleOAuthService,
  NativeGoogleOAuthProvider,
} from './google-oauth.service';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') as string,
        signOptions: {
          expiresIn: (configService.get<string>('JWT_ACCESS_EXPIRES') ??
            '15m') as StringValue,
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleOAuthService,
    NativeGoogleOAuthProvider,
    {
      provide: GOOGLE_OAUTH_PROVIDER,
      useExisting: NativeGoogleOAuthProvider,
    },
  ],
  controllers: [AuthController, GoogleOAuthController],
})
export class AuthModule {}
