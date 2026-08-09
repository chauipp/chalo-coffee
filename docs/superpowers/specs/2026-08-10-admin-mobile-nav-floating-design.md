# Thiết kế thanh điều hướng admin mobile dạng floating

## Mục tiêu

Làm thanh tab dưới trên điện thoại gọn, cân đối và đồng nhất hơn với các card/form mobile hiện tại.

## Thiết kế đã chốt

- Thanh nav vẫn cố định ở đáy màn hình và chỉ hiển thị dưới breakpoint `md`.
- Thanh có khoảng cách 8px với hai mép ngang và đáy (tôn trọng safe-area), nền trắng mờ, viền nhẹ, bóng đổ và bo góc lớn.
- Năm mục (`Dashboard`, `Thực đơn`, `Đơn hàng`, `Bàn & QR`, `Khác`) chia đều toàn bộ chiều rộng bằng grid 5 cột.
- Mỗi mục có chiều cao khoảng 54px, icon và nhãn cách nhau 3px, nhãn cỡ 10px để không bị chật.
- Mục active dùng nền brand nhạt và màu brand; mục thường dùng màu xám. Trạng thái dark mode giữ nguyên tương phản hiện tại.
- Bỏ căn lề `mr-14` dành riêng cho dev indicator để các mục không bị dồn lệch phải; dev indicator là overlay của Next.js, không thuộc UI sản phẩm.
- Luồng mở bottom-sheet của mục `Khác`, route active và aria attributes giữ nguyên.

## Kiểm thử

- Kiểm tra mobile E2E xác nhận nav hiển thị, nhãn không bị clip và điều hướng `Khác` vẫn hoạt động.
- Kiểm tra thêm CSS/geometry để 5 mục có cùng chiều rộng và nav không tạo overflow ngang.
