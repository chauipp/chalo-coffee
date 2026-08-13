# Thiết kế: Bỏ lựa chọn giao diện, chọn số lượng ngay trên menu và tách rõ sáng/tối

## Mục tiêu

Loại bỏ công tắc hai giao diện vốn đang cho cùng một kết quả; giúp khách chọn
số lượng món ngay tại card; đồng thời làm dark mode khác biệt rõ ràng về nền
và bề mặt thay vì chỉ đổi sắc nhẹ ở viền.

## Quyết định đã duyệt

- Gỡ `OrderThemeSwitch` khỏi header và bỏ store/chọn nhánh A/B không còn có ý
  nghĩa. Luồng khách chỉ có một giao diện.
- Với món không có modifier, card menu hiện stepper `− 1 +` và nút `Thêm`;
  bấm `+`/`−` chỉ đổi số lượng tạm thời, bấm `Thêm` mới đưa đúng số lượng vào
  giỏ. Mặc định là 1, nhỏ nhất 1, lớn nhất giữ `MAX_ITEM_QUANTITY` hiện có.
- Với món có modifier, CTA mở modal để bắt buộc chọn modifier; số lượng trong
  modal tiếp tục là nguồn chọn cuối cùng.
- Light: nền ivory/stone rất nhạt (`stone-50`), card trắng, viền stone-200.
  Dark: nền charcoal nâu rõ (`stone-950`), card stone-900, viền stone-700/800,
  header/sticky bar stone-950. CTA dùng espresso `brand-700` ở light và
  caramel `brand-300` ở dark.

## Phạm vi

Chỉ luồng khách dưới `src/app/(customer)/menu/[tableToken]/`: menu, giỏ,
checkout, danh sách đơn, chi tiết đơn và các test theme cũ. Không đổi nghiệp
vụ, API, cart/store dữ liệu, admin/staff/account.

## Nhận diện thương hiệu

- Thêm asset logo CHALO do chủ quán cung cấp tại `public/brand/chalo-logo.jpg`
  (file nguồn là JPEG; chuẩn hoá phần mở rộng đúng nội dung ảnh).
- Header menu thay ô chữ `CH` bằng logo này, hiển thị trong khung tròn nhỏ,
  `object-contain`, không cắt chữ/logo. Nền sáng giữ viền stone mảnh; nền tối
  dùng viền brand/carbon dịu để logo vàng–đen vẫn rõ.
- Không tái tạo, chỉnh nội dung hoặc suy diễn lại logo bằng AI; dùng nguyên
  ảnh do người dùng cung cấp.

## Kiểm chứng

- Test không còn tham chiếu `order-theme-*`; kiểm chọn `+` thành 2 rồi bấm
  `Thêm` cho đúng số lượng trong giỏ; món có modifier vẫn mở modal.
- Xem browser ở 375×667 và desktop cho light/dark, xác nhận nền trang và card
  phân biệt rõ, không tràn và console/network sạch.

## Plan thực thi

[Xem plan thực thi](../plans/2026-08-13-customer-menu-quantity-dark-light.md).
