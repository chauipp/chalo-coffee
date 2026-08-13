# Thiết kế: Làm mới tối giản giao diện đặt món khách hàng

## Mục tiêu

Thay hai phong cách thị giác cực đoan đang có bằng một hệ giao diện tối giản,
hiện đại và dễ đọc trong cả chế độ sáng lẫn tối. Luồng đặt món vẫn giữ nguyên
toàn bộ nghiệp vụ, thao tác và dữ liệu.

## Quyết định đã duyệt

- Dùng một ngôn ngữ hình ảnh thống nhất cho cả hai lựa chọn `Rực rỡ` và
  `Điện ảnh`; công tắc được giữ để không làm mất lựa chọn đã lưu của khách.
- Loại bỏ sắc cam neon, tím "carnival", viền comic, bóng đổ cứng, gradient
  nặng và các chuyển động trang trí liên tục trong luồng đặt món.
- Bảng màu chỉ dùng neutral stone ấm và một accent espresso trầm. Bản sáng là
  ivory/stone nhạt; bản tối là charcoal/slate dịu, không dùng đen tuyệt đối.

## Phạm vi

Áp dụng cho menu, modal chi tiết món, giỏ hàng, checkout, danh sách đơn và
chi tiết đơn trong `src/app/(customer)/`. Không thay đổi API, store nghiệp vụ,
logic tính tiền hoặc các màn admin/staff/account.

## Hệ thị giác

| Thành phần | Sáng | Tối |
| --- | --- | --- |
| Nền trang | stone-50 / ivory | stone-950, có sắc charcoal ấm |
| Bề mặt card | trắng, viền stone-200 mảnh | stone-900, viền stone-800 mảnh |
| Chữ chính | stone-900 | stone-100 |
| Chữ phụ | stone-600 | stone-400 |
| Accent/CTA | espresso `brand-700` | caramel dịu `brand-300/400` trên nền tối |

Card dùng bo góc vừa phải, bóng rất nhẹ hoặc không bóng. CTA rõ bằng màu
espresso và trạng thái focus/hover; không dùng thêm màu trang trí cạnh tranh.
Typography sans-serif hiện có được giữ, dùng weight và khoảng trắng để tạo
phân cấp thay vì serif hoặc chữ đè ảnh.

## Cách triển khai

- Các component `*.Cinematic` và `*.Playful` được rút về cùng cấu trúc/style
  tối giản, ưu tiên tái sử dụng lớp trình bày để hai nhánh không tiếp tục lệch.
- Gỡ các token màu carnival/pop không còn consumer và animation nảy/confetti
  chỉ mang tính trang trí; các dấu hiệu trạng thái và số lượng vẫn hiển thị
  tĩnh, rõ ràng.
- Giữ `orderTheme.store` và `OrderThemeSwitch` để tương thích localStorage;
  cập nhật nhãn nếu cần để không hứa hẹn hai phong cách khác nhau.
- Duy trì tương phản WCAG AA cho chữ và nút; kiểm thử bốn tổ hợp toggle cũ
  (hai lựa chọn order theme × sáng/tối) để xác nhận hành vi không đổi.

## Kiểm chứng

- Chạy lint và Playwright e2e liên quan đến customer order theme.
- Mở trực tiếp trên trình duyệt ở sáng/tối: menu, modal, giỏ, checkout và đơn
  hàng; kiểm desktop lẫn khung mobile hẹp.
- Xác nhận đổi theme, reload, thêm món và thanh toán không thay đổi hành vi.

## Ngoài phạm vi

- Không đổi nhận diện tổng thể admin/staff hoặc palette brand dùng ở các khu
  vực ngoài luồng khách hàng.
- Không thay đổi dữ liệu sản phẩm, ảnh món, endpoint hay schema.

## Plan thực thi

[Xem plan thực thi](../plans/2026-08-13-customer-order-minimal-theme.md).
