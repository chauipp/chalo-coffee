# Kết quả: Điều hướng trang chủ theo role

Spec: [thiết kế](../specs/2026-08-17-role-home-redirect-design.md) · Plan: [kế hoạch](../plans/2026-08-17-role-home-redirect.md)

## Đã làm gì

- Người đã đăng nhập mở `/` được chuyển thẳng tới màn mặc định: admin tới dashboard, staff tới đơn hàng và khách hàng tới tài khoản.
- Người chưa đăng nhập vẫn xem landing page; token có role không nhận diện cũng giữ tại landing page, không được điều hướng vào khu vực có quyền.
- Giữ nguyên quyền truy cập menu: mọi đường dẫn `/menu*`, kể cả `/menu` khi có cookie role lạ, vẫn đi thẳng vào menu như trước.
- Bổ sung regression Playwright cho ba role, khách chưa đăng nhập, role lạ tại `/`, và quyền truy cập `/menu`.
- Xác nhận redirect bằng Chromium ở desktop và 375×667; console/network sạch sau khi mock đúng các preload backend cần thiết.

## File chính

- `chalo-fe/middleware.ts` — thêm điều hướng theo role chỉ cho route gốc, giữ các guard và bypass menu sẵn có.
- `chalo-fe/e2e/home-role-redirect.spec.ts` — kiểm thử request đầu tiên của các role và các case không được đổi hành vi.
- `docs/superpowers/specs/2026-08-17-role-home-redirect-design.md` — đặc tả hành vi role và phạm vi thay đổi.
- `docs/superpowers/plans/2026-08-17-role-home-redirect.md` — kế hoạch đã hoàn tất, kèm liên kết tới summary này.

## Khác với plan

- Plan ban đầu dùng chung nhánh public route cho `/`; review phát hiện cách đó làm exact `/menu` đổi hành vi. Kết quả cuối cô lập redirect tại `/` và thêm regression bảo vệ bypass menu, đúng với phạm vi đã duyệt.

## Còn dở / cần lưu ý

Không.
