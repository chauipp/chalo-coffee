Trỏ về: [spec](../specs/2026-08-15-admin-global-prep-sidebar-design.md) · [plan](../plans/2026-08-15-admin-global-prep-sidebar.md)

# Summary: Right sidebar pha chế toàn cục cho Admin

## Đã làm gì

- Đưa PrepDock thành right sidebar desktop dùng chung cho mọi màn `/admin/*`, với rail dọc khi đóng và split-pane full-height khi mở.
- Lưu độc lập trạng thái mở/đóng và tỷ lệ pane của admin, không ảnh hưởng layout staff.
- Đặt nút thu gọn ngay trong header khu pha chế; mobile không thêm UX mới.
- Giữ bộ lọc lịch sử đơn khi chuyển qua lại giữa Vận hành và Lịch sử.
- Sửa chỉ báo realtime để phản ánh trạng thái kết nối SSE thực tế.
- Bổ sung E2E cho dashboard/orders, close–reopen rail, mobile không hiện rail desktop và regression staff.

## File chính

- `chalo-fe/src/app/(admin)/_components/AdminPrepSidebarLayout.tsx` — shell rail/split-pane toàn cục cho admin.
- `chalo-fe/src/app/(admin)/layout.tsx` — gắn shell vào layout admin.
- `chalo-fe/src/app/(admin)/admin/orders/page.tsx` — giữ mounted các mode và phản ánh trạng thái SSE.
- `chalo-fe/src/app/(staff)/_components/PrepDock.tsx` và `PrepStation.tsx` — callback thu gọn tùy chọn, staff vẫn giữ hành vi cũ.
- `chalo-fe/e2e/admin-prep-sidebar.spec.ts` và `admin-orders-operations.spec.ts` — kiểm thử luồng sidebar và order mode.

## Khác với plan

- Không lệch kiến trúc; phạm vi được cập nhật theo yêu cầu người dùng từ dock riêng Orders thành shell toàn cục Admin.
- Có một minor deferred: state test chưa có case storage hoàn toàn rỗng riêng biệt, dù hành vi runtime đúng.

## Còn dở / cần lưu ý

- Lint toàn repo vẫn có các lỗi tồn tại ngoài phạm vi feature.
- Dev server cần dùng cổng riêng và webpack khi máy chạm giới hạn file watcher; Playwright đã pass trên server mới ở cổng 3011/3012.
