export type ErrorTier = 'toast' | 'notification' | 'modal'

export interface ErrorConfig {
  tier: ErrorTier,
  message: string
}

export const HTTP_ERROR_MAP: Record<number, ErrorConfig> = {
  400: { tier: 'toast', message: 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại.' },
  401: { tier: 'modal', message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' },
  403: { tier: 'notification', message: 'Bạn không có quyền thực hiện thao tác này.' },
  404: { tier: 'toast', message: 'Không tìm thấy dữ liệu yêu cầu.' },
  408: { tier: 'toast', message: 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.' },
  500: { tier: 'toast', message: 'Lỗi máy chủ. Vui lòng thử lại sau.' },
  503: { tier: 'toast', message: 'Dịch vụ tạm thời không khả dụng.' },
}

export const BUSINESS_ERROR_MAP: Record<number, ErrorConfig> = {
  1002001: { tier: 'modal', message: 'Tài khoản của bạn đã bị vô hiệu hóa.' },
  1002002: { tier: 'modal', message: 'Refresh token không hợp lệ. Vui lòng đăng nhập lại.' },
  1002003: { tier: 'modal', message: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.' },
  1003001: { tier: 'notification', message: 'Bạn không có quyền truy cập tài nguyên này.' },
  2001001: { tier: 'notification', message: 'Bàn này hiện không khả dụng.' },
  2001002: { tier: 'toast', message: 'Đơn hàng đã được cập nhật bởi nhân viên khác.' },
  2002001: { tier: 'notification', message: 'Bàn đang được sử dụng, không thể xóa.' },
}

export const SILENT_ERROR_MESSAGES = [
  'Invalid refresh token',
  'Refresh token has expired',
  'Token không hợp lệ',
]

export const DEFAULT_ERROR_MESSAGE = 'Đã có lỗi xảy ra. Vui lòng thử lại.'