# Màn vận hành đơn realtime cho Admin

## Bối cảnh

Admin hiện có `/admin/orders` dạng bảng lịch sử, trong khi thao tác vận hành realtime (theo
cột trạng thái, chuyển trạng thái, xem chi tiết, thanh toán) chỉ nằm ở `/staff/orders`. Khi
admin đang ở khu quản trị mà có khách phát sinh, việc phải chuyển sang khu staff gây bất tiện.

## Mục tiêu

- Admin có màn vận hành đơn realtime đầy đủ như staff.
- Hai khu dùng chung logic hiển thị và cập nhật trạng thái, tránh hành vi bị lệch.
- Admin có thể mở/thu gọn `PrepDock` ngay trong màn đơn.
- `PrepDock` mặc định thu gọn ở admin để không chiếm diện tích khi admin chỉ xử lý đơn.
- Trạng thái mở/ẩn và độ rộng của `PrepDock` được ghi nhớ riêng cho admin.
- Mobile vẫn dùng được: `PrepDock` mở thành drawer/bottom sheet, không ép layout hai cột.

## Ngoài phạm vi

- Không thay đổi quyền backend hoặc tạo loại trạng thái đơn mới.
- Không đưa `PrepDock` vào toàn bộ `AdminLayout`; chỉ màn `/admin/orders` có khu pha chế.
- Không bỏ màn lịch sử/lọc đơn của admin; chức năng lịch sử sẽ được giữ trong cùng khu đơn
  hoặc được đặt ở một tab/khu lọc rõ ràng khi triển khai.

## Thiết kế trải nghiệm

### Màn admin orders

`/admin/orders` hiển thị bảng vận hành realtime với các cột giống staff: Khách đặt, Đang pha
chế, Sẵn sàng phục vụ và Đã phục vụ. Thẻ đơn hỗ trợ xem chi tiết, chuyển trạng thái bằng nút
nhanh hoặc kéo-thả ở nơi staff đang hỗ trợ. Admin vẫn nhìn được thanh toán và thao tác quản
trị lịch sử theo quyền hiện có.

### PrepDock

- Desktop: nằm ở panel bên phải, dùng cơ chế split-pane hiện có của staff.
- Mặc định: thu gọn ở lần đầu vào admin orders.
- Nút điều khiển: nhãn rõ “Mở khu pha chế” khi đang ẩn và “Thu gọn khu pha chế” khi đang mở.
- Khi mở: cho phép kéo chỉnh độ rộng như staff.
- Ghi nhớ: dùng storage key riêng cho admin, không làm thay đổi trạng thái panel của staff.
- Mobile: mở thành drawer/bottom sheet có nút đóng; không giữ panel cố định cạnh phải.

### Điều hướng và chi tiết đơn

Thẻ đơn dùng route chi tiết phù hợp với khu đang đứng, nhưng component chi tiết/thanh toán và
logic cập nhật được dùng chung. Mở thanh toán ở staff và admin đều mặc định “Cả bàn”, vẫn có
option “Đơn này”.

## Kiến trúc kỹ thuật

- Tách board vận hành, `KanbanColumn`, `OrderCard` và cấu hình trạng thái khỏi route staff
  thành các component dùng chung.
- Board nhận các dependency rõ ràng: danh sách đơn, trạng thái loading/live, callback cập nhật
  trạng thái và base path mở chi tiết.
- Staff giữ `StaffLayout` + `PrepDock`; admin orders dùng một wrapper split-pane cục bộ chỉ
  quanh màn orders, không ảnh hưởng các trang admin khác.
- Cả hai khu tiếp tục dùng query keys, mutation và SSE hiện có để invalidation nhất quán.
- Storage key cho admin phải khác key `staff-prep-split`; trạng thái mở/ẩn và kích thước không
  được ghi đè lẫn nhau.

## Trạng thái và lỗi

- Loading: hiển thị spinner khu board như staff.
- Mất kết nối SSE: giữ danh sách hiện tại, hiển thị trạng thái Connecting/Live và cho phép làm
  mới thủ công.
- Cập nhật trạng thái lỗi: giữ thẻ ở vị trí cũ, tắt trạng thái updating và hiển thị toast lỗi.
- `PrepDock` không tải được: board đơn vẫn hoạt động; panel hiển thị trạng thái lỗi và nút thử
  lại/thu gọn.

## Tiêu chí chấp nhận

1. Admin mở `/admin/orders` và thấy đơn realtime theo cùng các cột/trạng thái như staff.
2. Admin có thể mở chi tiết, chuyển trạng thái, thanh toán theo đơn hoặc cả bàn.
3. `PrepDock` mặc định thu gọn; mở/thu gọn được bằng một nút có nhãn rõ.
4. Trạng thái và độ rộng `PrepDock` của admin được nhớ sau khi reload, độc lập với staff.
5. Mobile không bị tràn ngang; `PrepDock` mở dưới dạng drawer/bottom sheet.
6. Các trang admin khác không xuất hiện `PrepDock` hoặc layout split-pane.
7. Test kiểm tra board dùng chung, toggle/storage của `PrepDock`, route chi tiết admin và luồng
   responsive; Playwright kiểm tra trực quan desktop/mobile, console và network.

## Plan thực thi

Xem [plan triển khai](../plans/2026-08-14-admin-operations-orders.md).
