import {
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createHash,
  createPublicKey,
  randomBytes,
  verify as verifySignature,
} from 'crypto';
import { AuthService } from './auth.service';
import type { LoginResponse } from './auth.service';
import type { VerifiedGoogleProfile } from './google-oauth.types';
export type { VerifiedGoogleProfile } from './google-oauth.types';

const GOOGLE_AUTHORIZATION_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const STATE_TTL_MS = 10 * 60 * 1000;
const EXCHANGE_CODE_TTL_MS = 2 * 60 * 1000;
const DEFAULT_RETURN_TO = '/account';

export interface GoogleOAuthProvider {
  createAuthorizationUrl(input: {
    state: string;
    codeChallenge: string;
  }): string;
  exchangeCode(
    code: string,
    codeVerifier: string,
  ): Promise<VerifiedGoogleProfile>;
}

export const GOOGLE_OAUTH_PROVIDER = 'GOOGLE_OAUTH_PROVIDER';

type GoogleIdTokenHeader = {
  alg?: string;
  kid?: string;
};

type GoogleIdTokenPayload = {
  iss?: string;
  aud?: string | string[];
  azp?: string;
  exp?: number;
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

type GoogleJwk = JsonWebKey & {
  kid?: string;
  alg?: string;
  use?: string;
  [key: string]: unknown;
};

@Injectable()
export class NativeGoogleOAuthProvider implements GoogleOAuthProvider {
  constructor(private readonly configService: ConfigService) {}

  createAuthorizationUrl(input: {
    state: string;
    codeChallenge: string;
  }): string {
    const url = new URL(GOOGLE_AUTHORIZATION_URL);
    url.searchParams.set(
      'client_id',
      this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
    );
    url.searchParams.set(
      'redirect_uri',
      this.configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
    );
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', input.state);
    url.searchParams.set('code_challenge', input.codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('prompt', 'select_account');
    return url.toString();
  }

  async exchangeCode(
    code: string,
    codeVerifier: string,
  ): Promise<VerifiedGoogleProfile> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
        client_secret: this.configService.getOrThrow<string>(
          'GOOGLE_CLIENT_SECRET',
        ),
        redirect_uri: this.configService.getOrThrow<string>(
          'GOOGLE_CALLBACK_URL',
        ),
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      throw new UnauthorizedException('Google authorization code is invalid');
    }

    const tokenResponse = (await response.json()) as { id_token?: string };
    if (!tokenResponse.id_token) {
      throw new UnauthorizedException('Google did not return an ID token');
    }

    return this.verifyIdToken(tokenResponse.id_token);
  }

  private async verifyIdToken(idToken: string): Promise<VerifiedGoogleProfile> {
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Malformed Google ID token');
    }

    const header = this.decodeJson<GoogleIdTokenHeader>(parts[0]);
    const payload = this.decodeJson<GoogleIdTokenPayload>(parts[1]);
    if (header.alg !== 'RS256' || !header.kid) {
      throw new UnauthorizedException('Unsupported Google ID token signature');
    }

    const jwksResponse = await fetch(GOOGLE_JWKS_URL);
    if (!jwksResponse.ok) {
      throw new ServiceUnavailableException('Unable to verify Google identity');
    }
    const jwks = (await jwksResponse.json()) as { keys?: GoogleJwk[] };
    const jwk = jwks.keys?.find(
      (candidate) =>
        candidate.kid === header.kid &&
        candidate.alg === 'RS256' &&
        candidate.use === 'sig',
    );
    if (!jwk) {
      throw new UnauthorizedException('Unknown Google signing key');
    }

    const signatureValid = verifySignature(
      'RSA-SHA256',
      Buffer.from(`${parts[0]}.${parts[1]}`),
      createPublicKey({ key: jwk, format: 'jwk' }),
      Buffer.from(parts[2], 'base64url'),
    );
    if (!signatureValid) {
      throw new UnauthorizedException('Invalid Google ID token signature');
    }

    const clientId = this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
    const validIssuer =
      payload.iss === 'accounts.google.com' ||
      payload.iss === 'https://accounts.google.com';
    const validAudience = Array.isArray(payload.aud)
      ? payload.aud.includes(clientId) &&
        (payload.aud.length === 1 || payload.azp === clientId)
      : payload.aud === clientId;
    const validExpiry =
      typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();

    if (
      !validIssuer ||
      !validAudience ||
      !validExpiry ||
      payload.email_verified !== true ||
      !payload.sub ||
      !payload.email
    ) {
      throw new UnauthorizedException('Google identity claims are invalid');
    }

    return {
      subject: payload.sub,
      email: payload.email.toLowerCase(),
      emailVerified: true,
      fullName: payload.name?.trim() || payload.email.split('@')[0],
      avatar: payload.picture ?? null,
    };
  }

  private decodeJson<T>(value: string): T {
    try {
      return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
    } catch {
      throw new UnauthorizedException('Malformed Google ID token');
    }
  }
}

type OAuthStateRecord = {
  codeVerifier: string;
  returnTo: string;
  expiresAt: number;
};

type ExchangeCodeRecord = {
  loginResponse: LoginResponse;
  expiresAt: number;
};

@Injectable()
export class GoogleOAuthService {
  private readonly states = new Map<string, OAuthStateRecord>();
  private readonly exchangeCodes = new Map<string, ExchangeCodeRecord>();

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    @Inject(GOOGLE_OAUTH_PROVIDER)
    private readonly provider: GoogleOAuthProvider,
  ) {}

  createAuthorizationUrl(returnTo?: string): string {
    this.assertEnabled();
    this.purgeExpired();

    const state = randomBytes(32).toString('base64url');
    const codeVerifier = randomBytes(48).toString('base64url');
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    this.states.set(state, {
      codeVerifier,
      returnTo: this.safeReturnTo(returnTo),
      expiresAt: Date.now() + STATE_TTL_MS,
    });

    return this.provider.createAuthorizationUrl({ state, codeChallenge });
  }

  async handleCallback(
    authorizationCode: string,
    state: string,
  ): Promise<{ redirectUrl: string }> {
    this.assertEnabled();
    const stateRecord = this.consumeState(state);
    const profile = await this.provider.exchangeCode(
      authorizationCode,
      stateRecord.codeVerifier,
    );
    const loginResponse = await this.authService.loginWithGoogle(profile);
    const exchangeCode = randomBytes(32).toString('base64url');
    this.exchangeCodes.set(exchangeCode, {
      loginResponse,
      expiresAt: Date.now() + EXCHANGE_CODE_TTL_MS,
    });

    const frontendUrl = new URL(
      '/oauth/google/callback',
      this.configService.getOrThrow<string>('FRONTEND_URL'),
    );
    frontendUrl.searchParams.set('code', exchangeCode);
    frontendUrl.searchParams.set('returnTo', stateRecord.returnTo);
    return { redirectUrl: frontendUrl.toString() };
  }

  async exchange(code: string): Promise<LoginResponse> {
    const record = this.exchangeCodes.get(code);
    this.exchangeCodes.delete(code);
    if (!record || record.expiresAt <= Date.now()) {
      throw new UnauthorizedException('Invalid or expired exchange code');
    }
    return record.loginResponse;
  }

  private consumeState(state: string): OAuthStateRecord {
    const record = this.states.get(state);
    this.states.delete(state);
    if (!record || record.expiresAt <= Date.now()) {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }
    return record;
  }

  private safeReturnTo(returnTo?: string): string {
    if (
      !returnTo ||
      !returnTo.startsWith('/') ||
      returnTo.startsWith('//') ||
      returnTo.includes('\\')
    ) {
      return DEFAULT_RETURN_TO;
    }
    return returnTo;
  }

  private assertEnabled(): void {
    if (this.configService.get<string>('GOOGLE_OAUTH_ENABLED') !== 'true') {
      throw new ServiceUnavailableException('Google OAuth is disabled');
    }
  }

  private purgeExpired(): void {
    const now = Date.now();
    for (const [state, record] of this.states) {
      if (record.expiresAt <= now) this.states.delete(state);
    }
    for (const [code, record] of this.exchangeCodes) {
      if (record.expiresAt <= now) this.exchangeCodes.delete(code);
    }
  }
}
