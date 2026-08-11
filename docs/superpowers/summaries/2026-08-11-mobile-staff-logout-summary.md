# Kết quả: đăng xuất staff mobile

Spec: [2026-08-11-mobile-staff-logout-design.md](../specs/2026-08-11-mobile-staff-logout-design.md) · Plan: [2026-08-11-mobile-staff-logout.md](../plans/2026-08-11-mobile-staff-logout.md)

## Đã làm gì

- Thêm mục “Đăng xuất” trực tiếp vào thanh điều hướng đáy của staff mobile.
- Dùng lại `useLogout`, nên phiên/token được xoá và trang tải lại về `/login`.
- Bổ sung test Playwright ở viewport 375×667; test đã chứng minh nút hiển thị, không tràn ngang và logout thành công.

## File chính

- `chalo-fe/src/app/(staff)/_components/MobileStaffNav.tsx`: thêm action logout thứ tư cho mobile.
- `chalo-fe/e2e/staff-mobile-logout.spec.ts`: kiểm luồng đăng nhập staff, logout, viewport và lỗi browser.

## Khác với plan

Không lệch.

## Còn dở / cần lưu ý

Không. Trong môi trường mock, staff có lỗi SSE cũ đến `localhost:8080/api/order/events`; test chỉ loại trừ đúng lỗi có sẵn này và vẫn chặn mọi lỗi console mới.
