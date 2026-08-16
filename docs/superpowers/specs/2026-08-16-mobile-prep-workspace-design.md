# Thiết kế: Màn pha chế mobile cho Staff và Admin

## Mục tiêu

Trên điện thoại, Staff và Admin đều có một màn Pha chế chuyên dụng để xem các đơn
`PREPARING` và tick từng ly nhanh, không phụ thuộc khu dock desktop.

## Phạm vi

- Tạo route `/staff/prep` và `/admin/prep`.
- Hai route dùng chung một workspace pha chế, tái sử dụng grouping, card, mutation và trạng
  thái hiện có của `PrepDock`/`PrepStation`.
- Màn mobile chiếm phần nội dung có thể cuộn; thanh điều hướng dưới vẫn hiển thị.
- Staff mobile dùng năm mục chính: Đơn hàng, POS, Pha chế, Bàn, Khác. Chốt ca và Đăng xuất
  chuyển vào sheet Khác.
- Admin mobile dùng năm mục chính: Tổng quan, Thực đơn, Đơn hàng, Pha chế, Khác.
- Mặc định workspace hiển thị Theo món, có thể đổi Theo bàn; thao tác tick từng ly và kéo/thả
  bắt đầu pha giữ hành vi hiện tại.

## Kiến trúc

Tách phần lấy dữ liệu và mutation từ `PrepDock` thành `PrepWorkspace`, nhận `enabled` để chỉ
subscribe/poll khi workspace đang được mở. `PrepDock` desktop và hai route mới chỉ render
workspace này. `PrepStation` tiếp tục là view thuần cho hai chế độ, giữ API hiện tại.

Routes mới không tạo API hay quyền mới: Admin đã sử dụng `PrepDock` hiện có, Staff cũng dùng
chính query/mutation đó. Empty state vẫn là trạng thái không có đơn `PREPARING`.

## Trải nghiệm mobile

Pha chế là liên kết trực tiếp một chạm trong bottom nav, không nằm trong dock/sidebar hay sau
modal. Nội dung có padding đáy theo safe area/nav, đủ chiều cao và chỉ cuộn khu card. Khi người
dùng không ở route Pha chế, mobile không mount workspace và không có polling active-order do
màn này tạo ra.

## Kiểm chứng

- Unit test điều hướng xác định Pha chế là tab active của Staff/Admin.
- Browser fixture kiểm Staff và Admin mở route đúng, thấy empty hoặc card pha chế, đổi Theo
  món/Theo bàn và tick một ly.
- Browser mobile 375×667 kiểm nav không che card/tick, console/network sạch.
- Browser kiểm route khác không gọi active-order/poll từ workspace mobile.

## Không làm

- Không đổi logic nhóm món, công thức ETA, trạng thái order hay endpoint backend.
- Không thay thiết kế dock/sidebar desktop.
- Không triển khai UI customer cho pha chế.
