# Nâng trải nghiệm landing page Chalo Coffee

## Mục tiêu

Tăng cá tính và tốc độ tìm món cho landing page công khai mà không thêm video, 3D, carousel hoặc backend mới. Trải nghiệm phải ưu tiên khách dùng điện thoại.

## Thiết kế

### Chọn mood hôm nay

Ngay dưới hero có ba nút: “Cần tỉnh táo”, “Muốn nhẹ nhàng”, “Muốn ngọt một chút”. Mỗi nút ánh xạ danh mục bằng từ khoá trong tên category: cà phê, trà, bánh/đồ ngọt. Khi bấm, trang cuộn mượt đến `#menu` và chọn chip danh mục tương ứng. Nếu menu không có danh mục phù hợp, nút vẫn cuộn tới menu và giữ “Tất cả”, không lỗi.

### Hơi nước hero

Minh hoạ ly cà phê hiện có thêm hai–ba vệt hơi nước CSS chuyển động chậm, opacity thấp. Khi hệ điều hành bật `prefers-reduced-motion`, animation bị tắt hoàn toàn.

### Thanh hành động mobile

Ở viewport dưới `sm`, thanh đáy gồm hai CTA “Thực đơn” và “Chỉ đường” chỉ xuất hiện sau khi hero đã rời viewport. Thanh không hiển thị trên desktop, có safe-area padding, không che footer/content nhờ thêm bottom padding tương ứng. “Thực đơn” cuộn đến menu; “Chỉ đường” mở cùng Google Maps URL.

## Phạm vi và kiểm thử

Không đổi API/admin data model/checkout. Thêm Playwright test cho mood selection, thanh mobile scroll state, no overflow và reduced motion. Kiểm trực quan Chromium desktop + mobile trước khi hoàn tất.

## Plan thực thi

Xem [plan](../plans/2026-08-12-landing-experience.md).
