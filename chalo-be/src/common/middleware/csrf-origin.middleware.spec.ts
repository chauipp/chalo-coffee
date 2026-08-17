import { shouldRejectCookieMutation } from './csrf-origin.middleware';

describe('shouldRejectCookieMutation', () => {
  const allowed = new Set(['https://chalocoffee.com']);

  it('cho phép mutation cookie cùng origin', () => {
    expect(
      shouldRejectCookieMutation({
        method: 'POST',
        cookieHeader: 'chalo_access=jwt',
        origin: 'https://chalocoffee.com',
        allowedOrigins: allowed,
      }),
    ).toBe(false);
  });

  it('từ chối mutation cookie từ origin lạ hoặc thiếu Origin', () => {
    expect(
      shouldRejectCookieMutation({
        method: 'DELETE',
        cookieHeader: 'chalo_access=jwt',
        origin: 'https://evil.example',
        allowedOrigins: allowed,
      }),
    ).toBe(true);
    expect(
      shouldRejectCookieMutation({
        method: 'POST',
        cookieHeader: 'chalo_refresh=refresh',
        origin: undefined,
        allowedOrigins: allowed,
      }),
    ).toBe(true);
  });

  it('không chặn GET hoặc webhook không có cookie phiên', () => {
    expect(
      shouldRejectCookieMutation({
        method: 'GET',
        cookieHeader: 'chalo_access=jwt',
        origin: undefined,
        allowedOrigins: allowed,
      }),
    ).toBe(false);
    expect(
      shouldRejectCookieMutation({
        method: 'POST',
        cookieHeader: undefined,
        origin: undefined,
        allowedOrigins: allowed,
      }),
    ).toBe(false);
  });
});
