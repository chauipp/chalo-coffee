import { GoogleOAuthController } from './google-oauth.controller';
import { GoogleOAuthService } from './google-oauth.service';

describe('GoogleOAuthController redirects', () => {
  const googleOAuthService = {
    createAuthorizationUrl: jest.fn(),
    handleCallback: jest.fn(),
    exchange: jest.fn(),
  };
  const response = { redirect: jest.fn() };
  const controller = new GoogleOAuthController(
    googleOAuthService as unknown as GoogleOAuthService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('writes the Google authorization URL directly to the HTTP redirect response', () => {
    googleOAuthService.createAuthorizationUrl.mockReturnValue(
      'https://accounts.google.com/o/oauth2/v2/auth?state=opaque',
    );

    controller.start({ returnTo: '/account' }, response as never);

    expect(response.redirect).toHaveBeenCalledWith(
      302,
      'https://accounts.google.com/o/oauth2/v2/auth?state=opaque',
    );
  });

  it('writes the frontend callback URL directly to the HTTP redirect response', async () => {
    googleOAuthService.handleCallback.mockResolvedValue({
      redirectUrl: 'https://chalocoffee.com/oauth/google/callback?code=opaque',
    });

    await controller.callback(
      { code: 'google-code', state: 'valid-state' },
      response as never,
    );

    expect(response.redirect).toHaveBeenCalledWith(
      302,
      'https://chalocoffee.com/oauth/google/callback?code=opaque',
    );
  });
});
