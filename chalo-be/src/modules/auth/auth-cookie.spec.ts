import {
  AUTH_COOKIES,
  clearAuthCookies,
  readRequestCookie,
  setAuthCookies,
} from './auth-cookie';

describe('auth-cookie', () => {
  it('đặt access/refresh HttpOnly và role UI riêng', () => {
    const cookie = jest.fn();
    setAuthCookies(
      { cookie } as never,
      { accessToken: 'access', refreshToken: 'refresh' },
      'ADMIN' as never,
      true,
    );

    expect(cookie).toHaveBeenCalledWith(
      AUTH_COOKIES.access,
      'access',
      expect.objectContaining({ httpOnly: true, secure: true, sameSite: 'strict', path: '/' }),
    );
    expect(cookie).toHaveBeenCalledWith(
      AUTH_COOKIES.refresh,
      'refresh',
      expect.objectContaining({ httpOnly: true, secure: true, sameSite: 'strict', path: '/api/auth' }),
    );
    expect(cookie).toHaveBeenCalledWith(
      AUTH_COOKIES.role,
      'ADMIN',
      expect.objectContaining({ httpOnly: false, secure: true, sameSite: 'strict', path: '/' }),
    );
  });

  it('đọc cookie từ raw Cookie header và xoá đầy đủ khi logout', () => {
    expect(readRequestCookie('a=1; chalo_refresh=refresh%20token', AUTH_COOKIES.refresh)).toBe('refresh token');
    const clearCookie = jest.fn();
    clearAuthCookies({ clearCookie } as never, false);
    expect(clearCookie).toHaveBeenCalledWith(AUTH_COOKIES.access, expect.objectContaining({ path: '/' }));
    expect(clearCookie).toHaveBeenCalledWith(AUTH_COOKIES.refresh, expect.objectContaining({ path: '/api/auth' }));
    expect(clearCookie).toHaveBeenCalledWith(AUTH_COOKIES.role, expect.objectContaining({ path: '/' }));
  });
});
