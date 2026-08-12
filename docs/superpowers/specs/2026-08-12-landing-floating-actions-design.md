# Floating actions cho landing — thiết kế

## Mục tiêu

Cho khách một đường liên hệ và tìm đường luôn hiện ở góc phải dưới mà không làm landing bị rối.

## Trải nghiệm

- Hai nút tròn 48px xếp dọc: Zalo ở trên, Chỉ đường ở dưới.
- Icon dễ nhận diện, nền tương phản theo tông cà phê; hover/focus desktop hiện nhãn ngắn bên trái.
- Mỗi nút có `aria-label`, mở đúng liên kết Zalo/Maps ở tab mới.
- Trên mobile, cụm nút nâng lên khi thanh CTA đáy đang hiển thị để không chồng lên nhau; khi dock ẩn, về sát đáy theo safe-area.
- Không thêm dependency, endpoint, hay thay đổi luồng menu hiện có.

## Kiểm chứng

Kiểm Chromium desktop và 375×667: hai action nhìn thấy được, không tràn ngang, không che dock, link đúng, console/network sạch.

## Plan thực thi

Sẽ trỏ tới [2026-08-12-landing-floating-actions.md](../plans/2026-08-12-landing-floating-actions.md) khi plan được tạo.
