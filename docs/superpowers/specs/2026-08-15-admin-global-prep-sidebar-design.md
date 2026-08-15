# Right sidebar pha chế toàn cục cho Admin

## Mục tiêu

Admin có một right sidebar pha chế nhất quán ở mọi màn `/admin/*` trên desktop. Khi mở, nó chiếm một pane riêng và toàn bộ nội dung admin co lại như layout staff; khi đóng, chỉ giữ một rail mỏng ở mép phải để mở lại.

## Phạm vi

- Chỉ desktop (`md` trở lên).
- Áp dụng cho mọi route trong `AdminLayout`, gồm dashboard, thực đơn, đơn hàng, bàn & QR, người dùng, cài đặt và chốt ca.
- Mobile không thay đổi trong đợt này. Không thêm drawer, rail, hay hành vi responsive mới cho mobile.

## Hành vi

- Mặc định dock admin đóng.
- Khi đóng, một rail dọc ở mép phải viewport có nhãn/icon “Pha chế”; rail là nút truy cập được bằng bàn phím và có `aria-expanded="false"`.
- Khi mở, `PrepDock` nằm trong pane phải, cao bằng vùng làm việc của admin và không phủ lên nội dung. Pane trái giữ nguyên state trang hiện tại.
- Header của `PrepDock` có nút “Thu gọn khu pha chế”; bấm nút sẽ đóng pane và trở về rail. Escape chỉ giữ hành vi hiện có cho chế độ phóng to nội bộ của PrepDock, không đóng toàn bộ dock desktop.
- Tỷ lệ pane lưu riêng bằng `admin-prep-split:v1`; trạng thái mở/đóng lưu riêng bằng `admin-prep-visible:v1`. Không dùng hoặc làm thay đổi key staff.
- Staff layout không thay đổi hành vi: PrepDock vẫn luôn hiện trong `StaffLayout` như hiện tại.

## Kiến trúc

- `AdminLayout` trở thành chủ sở hữu của split layout desktop, thay vì `/admin/orders`.
- Một component client mới quản lý state localStorage, rail đóng và `SplitPane` mở. Nó nhận `children` là toàn bộ vùng main của admin.
- `AdminOrdersOperationsLayout` chỉ còn trách nhiệm render board/lịch sử đơn hàng. Dock-specific layout và drawer admin hiện tại được loại khỏi route này.
- `PrepDock`/`PrepStation` nhận callback tùy chọn để render nút thu gọn khi được dùng trong admin; callback không được làm thay đổi staff.

## UI và accessibility

- Rail không che nội dung và có hit target tối thiểu 40px.
- Pane dock không dùng overlay desktop; divider của `SplitPane` tiếp tục kéo được bằng pointer và bàn phím.
- Rail có `aria-controls` trỏ tới pane dock khi mở; nút trong dock có nhãn rõ ràng “Thu gọn khu pha chế”.
- Không thêm control mở/đóng trong tiêu đề từng trang admin.

## Kiểm thử

- Unit test state: đóng mặc định, đọc/ghi đúng key admin và không ảnh hưởng `staff-prep-split`.
- Playwright desktop: từ dashboard và một trang admin khác, rail mở được dock; nội dung không bị overlay; dock có header và nút thu gọn; đóng đưa về rail.
- Regression: `/staff/orders` vẫn có PrepDock thường trực.

## Không làm

- Không thay đổi API, auth, SSE, enum order, hoặc cấu trúc backend.
- Không triển khai UX mobile trong feature này.
- Không đưa split pane vào layout customer hoặc staff.

## Plan thực thi

[2026-08-15-admin-global-prep-sidebar.md](../plans/2026-08-15-admin-global-prep-sidebar.md)
