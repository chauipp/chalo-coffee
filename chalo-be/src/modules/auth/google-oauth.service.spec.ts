import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import {
  GoogleOAuthService,
  GoogleOAuthProvider,
  VerifiedGoogleProfile,
} from './google-oauth.service';
import { UserService } from '../user/user.service';
import { UserRole } from '../../common/enums/user-role.enum';
import { generateKeyPairSync, sign } from 'crypto';
import { NativeGoogleOAuthProvider } from './google-oauth.service';

class FakeGoogleOAuthProvider implements GoogleOAuthProvider {
  private readonly profile: VerifiedGoogleProfile = {
    subject: 'google-subject-123',
    email: 'customer@example.com',
    emailVerified: true,
    fullName: 'Khách Google',
    avatar: 'https://example.com/avatar.jpg',
  };

  createAuthorizationUrl(input: {
    state: string;
    codeChallenge: string;
  }): string {
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('state', input.state);
    url.searchParams.set('code_challenge', input.codeChallenge);
    return url.toString();
  }

  async exchangeCode(): Promise<VerifiedGoogleProfile> {
    return this.profile;
  }
}

describe('Google OAuth backend', () => {
  const loginResponse = {
    accessToken: 'access.jwt',
    refreshToken: 'refresh.jwt',
    user: {
      id: 12,
      username: 'google_customer',
      fullName: 'Khách Google',
      avatar: 'https://example.com/avatar.jpg',
      role: UserRole.CUSTOMER,
      permission: [],
    },
  };

  let authService: { loginWithGoogle: jest.Mock };
  let service: GoogleOAuthService;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-12T03:00:00.000Z'));
    authService = {
      loginWithGoogle: jest.fn().mockResolvedValue(loginResponse),
    };
    const config = new ConfigService({
      GOOGLE_OAUTH_ENABLED: 'true',
      GOOGLE_CALLBACK_URL: 'https://api.example.com/api/auth/google/callback',
      FRONTEND_URL: 'https://chalocoffee.com',
    });
    service = new GoogleOAuthService(
      authService as unknown as AuthService,
      config,
      new FakeGoogleOAuthProvider(),
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  async function completeCallback(returnTo = '/account') {
    const authorizationUrl = new URL(service.createAuthorizationUrl(returnTo));
    const state = authorizationUrl.searchParams.get('state');
    if (!state) throw new Error('missing state in authorization URL');
    return service.handleCallback('google-authorization-code', state);
  }

  it('uses an opaque one-time code and never puts JWTs in the callback redirect', async () => {
    const callback = await completeCallback('/account');
    const redirect = new URL(callback.redirectUrl);
    const exchangeCode = redirect.searchParams.get('code');

    expect(redirect.origin).toBe('https://chalocoffee.com');
    expect(redirect.pathname).toBe('/oauth/google/callback');
    expect(redirect.searchParams.get('returnTo')).toBe('/account');
    expect(exchangeCode).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(callback.redirectUrl).not.toContain('access.jwt');
    expect(callback.redirectUrl).not.toContain('refresh.jwt');

    await expect(service.exchange(exchangeCode!)).resolves.toEqual(
      loginResponse,
    );
    await expect(service.exchange(exchangeCode!)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects an expired exchange code', async () => {
    const callback = await completeCallback();
    const exchangeCode = new URL(callback.redirectUrl).searchParams.get('code');

    jest.advanceTimersByTime(2 * 60 * 1000 + 1);

    await expect(service.exchange(exchangeCode!)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('consumes OAuth state once and rejects replayed callbacks', async () => {
    const authorizationUrl = new URL(
      service.createAuthorizationUrl('/account'),
    );
    const state = authorizationUrl.searchParams.get('state')!;

    await service.handleCallback('first-code', state);

    await expect(
      service.handleCallback('replayed-code', state),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('prevents an external returnTo from becoming an open redirect', async () => {
    const callback = await completeCallback('https://evil.example/steal');
    const redirect = new URL(callback.redirectUrl);

    expect(redirect.origin).toBe('https://chalocoffee.com');
    expect(redirect.searchParams.get('returnTo')).toBe('/account');
  });
});

describe('NativeGoogleOAuthProvider ID token verification', () => {
  const clientId = 'client-id.apps.googleusercontent.com';
  const config = new ConfigService({
    GOOGLE_CLIENT_ID: clientId,
    GOOGLE_CLIENT_SECRET: 'client-secret',
    GOOGLE_CALLBACK_URL: 'https://api.example.com/api/auth/google/callback',
  });
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  const publicJwk = {
    ...publicKey.export({ format: 'jwk' }),
    kid: 'test-key',
    alg: 'RS256',
    use: 'sig',
  };

  function idToken(claims: Record<string, unknown>): string {
    const header = Buffer.from(
      JSON.stringify({ alg: 'RS256', kid: 'test-key', typ: 'JWT' }),
    ).toString('base64url');
    const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
    const signature = sign(
      'RSA-SHA256',
      Buffer.from(`${header}.${payload}`),
      privateKey,
    ).toString('base64url');
    return `${header}.${payload}.${signature}`;
  }

  function mockGoogleResponses(token: string): void {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id_token: token }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ keys: [publicJwk] }), { status: 200 }),
      );
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('accepts a signed Google ID token with verified email and matching claims', async () => {
    const token = idToken({
      iss: 'https://accounts.google.com',
      aud: clientId,
      exp: Math.floor(Date.now() / 1000) + 300,
      sub: 'google-subject-123',
      email: 'Customer@Example.com',
      email_verified: true,
      name: 'Khách Google',
      picture: 'https://example.com/avatar.jpg',
    });
    mockGoogleResponses(token);
    const provider = new NativeGoogleOAuthProvider(config);

    await expect(provider.exchangeCode('code', 'verifier')).resolves.toEqual({
      subject: 'google-subject-123',
      email: 'customer@example.com',
      emailVerified: true,
      fullName: 'Khách Google',
      avatar: 'https://example.com/avatar.jpg',
    });
  });

  it('rejects a multi-audience token without an authorized-party claim', async () => {
    const token = idToken({
      iss: 'https://accounts.google.com',
      aud: [clientId, 'another-client'],
      exp: Math.floor(Date.now() / 1000) + 300,
      sub: 'google-subject-123',
      email: 'customer@example.com',
      email_verified: true,
    });
    mockGoogleResponses(token);
    const provider = new NativeGoogleOAuthProvider(config);

    await expect(
      provider.exchangeCode('code', 'verifier'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('AuthService.loginWithGoogle', () => {
  it('returns the database CUSTOMER and never trusts a role supplied by Google', async () => {
    const userService = {
      findOrCreateGoogleCustomer: jest.fn().mockResolvedValue({
        id: 21,
        username: 'google_customer',
        fullName: 'Khách Google',
        avatar: null,
        role: UserRole.CUSTOMER,
        isActive: true,
      }),
      setRefreshTokenHash: jest.fn().mockResolvedValue(undefined),
    };
    const jwtService = {
      sign: jest
        .fn()
        .mockReturnValueOnce('access.jwt')
        .mockReturnValueOnce('refresh.jwt'),
    };
    const config = { get: jest.fn(() => 'a-secure-test-secret') };
    const authService = new AuthService(
      userService as unknown as UserService,
      jwtService as unknown as JwtService,
      config as unknown as ConfigService,
    );
    const untrustedProfile = {
      subject: 'google-subject-123',
      email: 'customer@example.com',
      emailVerified: true as const,
      fullName: 'Khách Google',
      avatar: null,
      role: UserRole.ADMIN,
    };

    const result = await authService.loginWithGoogle(untrustedProfile);

    expect(result.user.role).toBe(UserRole.CUSTOMER);
    expect(result.user.permission).toEqual([]);
    expect(userService.findOrCreateGoogleCustomer).toHaveBeenCalledWith({
      subject: 'google-subject-123',
      email: 'customer@example.com',
      emailVerified: true,
      fullName: 'Khách Google',
      avatar: null,
    });
  });
});
