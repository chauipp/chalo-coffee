// src/mocks/handlers/auth.handlers.ts
import { USER_ROLE } from '@/constants';
import { http, HttpResponse, delay } from 'msw'

let activeUser: object | null = null

export const authHandlers = [
  // POST /api/auth/login
  http.post('*/api/auth/login', async ({ request }) => {
    await delay(500) // giả lập network latency
    const body = await request.json() as { username: string; password: string }

    // Mock 3 accounts tương ứng 3 role
    const accounts: Record<string, object> = {
      'admin': {
        user: { id: 1, username: 'admin', fullName: 'Nguyễn Văn Admin', avatar: null, role: USER_ROLE.ADMIN, permissions: ['menu:write', 'table:write', 'order:write', 'staff:write'] },
      },
      'staff': {
        user: { id: 2, username: 'staff', fullName: 'Trần Thị Nhân Viên', avatar: null, role: USER_ROLE.MODERATOR, permissions: ['order:write', 'order:read'] },
      },
    }

    const account = accounts[body.username]
    if (!account || body.password !== '123456') {
      return HttpResponse.json({ code: 401, message: 'Sai tên đăng nhập hoặc mật khẩu', data: null }, { status: 401 })
    }

    activeUser = (account as { user: object }).user
    return HttpResponse.json({ code: 200, message: 'success', data: account })
  }),

  // GET /api/auth/me
  http.get('*/api/auth/me', () => {
    if (!activeUser) return HttpResponse.json({ code: 401, message: 'Unauthorized', data: null }, { status: 401 })
    return HttpResponse.json({ code: 200, message: 'success', data: activeUser })
  }),

  // POST /api/auth/refresh-token
  http.post('*/api/auth/refresh-token', async () => {
    await delay(300)
    return HttpResponse.json({
      code: 200, message: 'success',
      data: { user: activeUser },
    })
  }),

  http.post('*/api/auth/logout', () => {
    activeUser = null
    return HttpResponse.json({ code: 200, message: 'success', data: null })
  }),
]
