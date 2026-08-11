# Tổng kết: nút đăng xuất mobile admin

Liên quan: [spec](../specs/2026-08-11-mobile-admin-logout-design.md) · [plan](../plans/2026-08-11-mobile-admin-logout.md)

## Đã làm gì

- Thêm nút `Đăng xuất` vào sheet `Khác` của mobile admin, với icon, màu hành động và vùng bấm cao 44px.
- Dùng lại `useLogout` để xoá phiên nhất quán với menu desktop và hard-navigate về `/login`.
- Thêm E2E test mô tả luồng mở sheet → logout → thấy form đăng nhập.
- Kiểm UI trên Playwright ở 375×667: nút hiển thị đúng trong sheet; click gửi logout 200 và quay về `/login`.

## File chính

- `chalo-fe/src/app/(admin)/_components/MobileAdminNav.tsx`: render hành động logout trong bottom sheet mobile.
- `chalo-fe/e2e/admin-mobile.spec.ts`: kiểm thử luồng logout trên mobile admin.
- `docs/superpowers/specs/2026-08-11-mobile-admin-logout-design.md`: quyết định thiết kế.
- `docs/superpowers/plans/2026-08-11-mobile-admin-logout.md`: kế hoạch đã tick hoàn tất.

## Khác với plan

- Playwright E2E CLI không chạy được trên máy này vì WebKit thiếu system dependencies; đã kiểm đúng luồng bằng Playwright MCP (Chromium, viewport 375×667). App dev cần `WATCHPACK_POLLING=true` do giới hạn file watcher của máy.

## Còn dở / cần lưu ý

- Không. Lint và `next build` của `origin/main` vẫn fail ở các lỗi có sẵn, không liên quan tới thay đổi này; TypeScript check và 5 unit test đều pass.
