// src/mocks/handlers/auth.handlers.ts
import { USER_ROLE } from '@/constants';
import { http, HttpResponse, delay } from 'msw'

export const authHandlers = [
  // POST /api/auth/login
  http.post('*/api/auth/login', async ({ request }) => {
    await delay(500) // giả lập network latency
    const body = await request.json() as { username: string; password: string }

    // Mock 3 accounts tương ứng 3 role
    const accounts: Record<string, object> = {
      'admin': {
        accessToken: 'mock-access-token-admin',
        refreshToken: 'mock-refresh-token-admin',
        user: { id: 1, username: 'admin', fullName: 'Nguyễn Văn Admin', avatar: null, role: USER_ROLE.ADMIN, permissions: ['menu:write', 'table:write', 'order:write', 'staff:write'] },
      },
      'staff': {
        accessToken: 'mock-access-token-staff',
        refreshToken: 'mock-refresh-token-staff',
        user: { id: 2, username: 'staff', fullName: 'Trần Thị Nhân Viên', avatar: null, role: USER_ROLE.MODERATOR, permissions: ['order:write', 'order:read'] },
      },
    }

    const account = accounts[body.username]
    if (!account || body.password !== '123456') {
      return HttpResponse.json({ code: 401, message: 'Sai tên đăng nhập hoặc mật khẩu', data: null }, { status: 401 })
    }

    return HttpResponse.json({ code: 200, message: 'success', data: account })
  }),

  // GET /api/auth/me
  http.get('*/api/auth/me', ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth) return HttpResponse.json({ code: 401, message: 'Unauthorized', data: null }, { status: 401 })

    const isAdmin = auth.includes('admin')
    return HttpResponse.json({
      code: 200, message: 'success',
      data: isAdmin
        ? { id: 1, username: 'admin', fullName: 'Nguyễn Văn Admin', avatar: null, role: 'ADMIN', permissions: ['menu:write', 'table:write', 'order:write', 'staff:write'] }
        : { id: 2, username: 'staff', fullName: 'Trần Thị Nhân Viên', avatar: null, role: 'MODERATOR', permissions: ['order:write', 'order:read'] },
    })
  }),

  // POST /api/auth/refresh-token
  http.post('*/api/auth/refresh-token', async ({ request }) => {
    await delay(300)
    const body = await request.json() as { refreshToken: string }
    if (!body.refreshToken.startsWith('mock-refresh-token')) {
      return HttpResponse.json({ code: 401, message: 'Invalid refresh token', data: null }, { status: 401 })
    }
    const role = body.refreshToken.includes('admin') ? 'admin' : 'staff'
    return HttpResponse.json({
      code: 200, message: 'success',
      data: { accessToken: `mock-access-token-${role}-new`, refreshToken: `mock-refresh-token-${role}` },
    })
  }),

  http.post('*/api/auth/logout', () =>
    HttpResponse.json({ code: 200, message: 'success', data: null })
  ),
]