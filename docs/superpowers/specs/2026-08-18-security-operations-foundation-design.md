# Nền tảng an toàn ứng dụng Chalo Coffee

## Mục tiêu

Tạo một PR nhỏ, độc lập để bảo vệ phiên cookie vừa được đưa vào production và
giảm nguy cơ lộ dữ liệu vận hành. PR không thay đổi luồng thanh toán, tồn kho,
UI nghiệp vụ hoặc cơ chế chuyển trang PWA đã merge.

## Phạm vi

- Chỉ nhận CORS credential từ các origin trong `CORS_ORIGIN`.
- Chặn các request thay đổi dữ liệu dùng cookie-session khi `Origin` không hợp
  lệ (CSRF origin guard); Bearer token máy-máy vẫn hoạt động theo contract API.
- Áp throttle riêng cho login, register và refresh token.
- Loại query nhạy cảm khỏi request log (token, password, key, secret).
- Chặn seed production khi thiếu mật khẩu mạnh cấu hình qua environment.
- Cập nhật dependency production có advisory mức high/critical và thêm cổng
  audit vào CI.

## Ngoài phạm vi

- Health/metrics, backup/restore, deploy smoke-test và request-id: tách thành
  PR độ tin cậy vận hành tiếp theo.
- SePay, tồn kho, hoàn tiền, loyalty, dashboard và log hoạt động.
- Cookie HttpOnly, redirect role/PWA và SSE cookie: đã nằm ở PR #3, chỉ tương
  tác qua CSRF guard, không sao chép lại implementation.

## Thiết kế

`CorsConfig` đọc allow-list từ environment thay vì phản hồi origin tùy ý.
Middleware CSRF chỉ kiểm tra các mutation có cookie phiên; request không có
cookie hoặc sử dụng Bearer token giữ nguyên hành vi hiện có. Các endpoint auth
được khai báo throttle nhỏ, độc lập với throttle chung để giảm brute force mà
không làm nghẽn các API vận hành.

Request logger nhận URL đã redaction trước khi ghi log. Danh sách khóa nhạy cảm
không phụ thuộc chữ hoa/thường và thay giá trị bằng `[REDACTED]`. Seed production
phải có secret được cấu hình rõ; không được tạo tài khoản bằng mật khẩu mặc định.

Script audit dependency kiểm tra riêng production dependency của backend và
frontend. CI dừng trước build/deploy nếu audit báo high hoặc critical.

## Kiểm chứng

- Jest: CORS allow/deny, CSRF cookie/Bearer, throttle metadata, redaction và
  guard seed production.
- Audit: không còn advisory production high/critical.
- Build backend/frontend và test suite phù hợp đều xanh.
- Playwright chỉ chạy smoke cho PWA role đã merge để chứng minh CSRF không làm
  hỏng khôi phục phiên admin/staff.

## Tiêu chí nghiệm thu

1. Origin lạ không nhận header CORS credential và mutation cookie-session bị
   từ chối.
2. Log không còn giá trị bí mật trong query string.
3. Login/register/refresh bị giới hạn thử theo policy đã cấu hình.
4. Production seed không thể chạy an toàn khi thiếu secret bắt buộc.
5. Không có high/critical production advisory tại thời điểm merge.

## Plan thực thi

[Kế hoạch triển khai](../plans/2026-08-18-security-operations-foundation.md)
