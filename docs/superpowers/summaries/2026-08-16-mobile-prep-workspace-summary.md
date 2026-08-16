[Spec thiết kế](../specs/2026-08-16-mobile-prep-workspace-design.md) · [Plan thực thi](../plans/2026-08-16-mobile-prep-workspace.md)

# Mobile Prep Workspace — Kết quả

## Đã làm gì

- Staff và Admin có route Pha chế chuyên dụng, dùng chung workspace pha chế đang có và vẫn hỗ trợ đổi chế độ Theo món/Theo bàn cùng thao tác tick ly.
- Pha chế là tab trực tiếp trên thanh điều hướng mobile cho cả hai vai trò; các mục phụ vẫn nằm trong Khác.
- E2E production standalone ở 375×667 kiểm route, nav, toggle, tick, console/network và xác nhận `/staff/pos` cùng `/admin/dashboard` không gọi active-order sau hơn 10 giây, kể cả khi persistence desktop đang bật; `/staff/prep` vẫn có gọi.
- Fixture browser dùng persona MODERATOR cho Staff và ADMIN cho Admin; mobile Admin hiển thị nhãn `Tổng quan`, còn desktop giữ `Dashboard`.

## File chính

- `chalo-fe/src/app/(staff)/_components/PrepWorkspace.tsx`: workspace dùng chung quản lý active-order và thao tác pha chế.
- `chalo-fe/src/app/(staff)/staff/prep/page.tsx` và `chalo-fe/src/app/(admin)/admin/prep/page.tsx`: hai trang Pha chế full-content.
- `chalo-fe/src/app/(staff)/_components/MobileStaffNav.tsx` và `chalo-fe/src/app/(admin)/_components/MobileAdminNav.tsx`: điều hướng mobile đến workspace và vùng Khác.
- `chalo-fe/src/app/(admin)/_components/AdminPrepSidebarLayout.tsx`: chỉ mount dock pha chế đã lưu khi màn hình desktop.
- `chalo-fe/e2e/mobile-prep-workspace.spec.ts`: fixture và regression browser cho hành vi workspace, navigation và lifecycle request.

## Khác với plan

Không lệch. Bổ sung gate media-query cho persistence desktop và fixture persona thật để coverage lifecycle phản ánh đúng quyền middleware.

## Còn dở / cần lưu ý

Không.
