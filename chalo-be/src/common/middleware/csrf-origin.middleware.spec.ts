import { shouldRejectCookieMutation } from './csrf-origin.middleware';

describe('shouldRejectCookieMutation', () => {
  const allowedOrigins = new Set(['https://chalocoffee.com']);
  const cookieHeader = 'chalo_access=signed-session';

  it('rejects a cross-origin mutation authenticated by cookie', () => {
    expect(
      shouldRejectCookieMutation({
        method: 'POST',
        cookieHeader,
        origin: 'https://evil.example',
        allowedOrigins,
      }),
    ).toBe(true);
  });

  it('allows safe methods, bearer-style requests and allowed same-origin mutations', () => {
    expect(
      shouldRejectCookieMutation({ method: 'GET', cookieHeader, origin: undefined, allowedOrigins }),
    ).toBe(false);
    expect(
      shouldRejectCookieMutation({ method: 'POST', cookieHeader: undefined, origin: undefined, allowedOrigins }),
    ).toBe(false);
    expect(
      shouldRejectCookieMutation({
        method: 'PATCH',
        cookieHeader,
        origin: 'https://chalocoffee.com',
        allowedOrigins,
      }),
    ).toBe(false);
  });

  it('rejects a cookie mutation with a missing Origin header', () => {
    expect(
      shouldRejectCookieMutation({ method: 'DELETE', cookieHeader, origin: undefined, allowedOrigins }),
    ).toBe(true);
  });
});
