← [Spec](../specs/2026-08-13-customer-menu-quantity-dark-light-design.md) · [Plan](../plans/2026-08-13-customer-menu-quantity-dark-light.md)

# Bỏ lựa chọn giao diện, chọn số lượng ngay trên menu và tách rõ sáng/tối — Kết quả

## Đã làm gì

- Gỡ hoàn toàn switch `Tiêu chuẩn / Tập trung`, state localStorage A/B và các
  component wrapper trùng lặp; luồng khách chỉ còn một giao diện.
- Thêm logo CHALO do chủ quán cung cấp vào header menu, thay phần monogram CH.
- Card món không modifier có stepper `− 1 +` và nút `Thêm`; thêm chính xác số
  lượng đã chọn vào giỏ, còn món có modifier vẫn mở modal chọn tuỳ chọn.
- Dark mode dùng nền `stone-950`, card/surface `stone-900` đặc và viền rõ hơn;
  light mode giữ ivory/white để khác biệt bề mặt dễ nhận thấy.
- Chạy 23 unit tests, build, e2e chọn số lượng/thêm giỏ; đã xem menu qua
  Playwright ở mobile sáng/tối và desktop.

## File chính

- `chalo-fe/public/brand/chalo-logo.jpg` — logo gốc CHALO được thêm vào ứng dụng.
- `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/ProductCard.Cinematic.tsx` — stepper lượng món và CTA thêm giỏ.
- `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/CustomerMenuView.Cinematic.tsx` — logo header và bề mặt menu.
- `chalo-fe/src/app/(customer)/menu/[tableToken]/**/_components/*.tsx` — các bề mặt dark mode được làm đậm/rõ hơn.
- `chalo-fe/e2e/customer-order-theme.spec.ts` — kiểm hồi quy chọn 2 món trước khi thêm giỏ.

## Khác với plan

- Agent điều phối đã tạo commit Task 1 nhưng không trả report; thay vì chờ tiếp, phần còn lại được hoàn tất trực tiếp và kiểm chứng.
- Logo nguồn có nội dung JPEG dù ban đầu được đặt tên `.png`; asset đã chuẩn hoá thành `.jpg`.

## Còn dở / cần lưu ý

- `pnpm --dir chalo-fe lint` vẫn có 14 lỗi có sẵn ở khu vực admin/staff/hooks ngoài phạm vi; unit test, build và e2e liên quan đều xanh.
- Ảnh browser menu hiển thị occupied modal vì bàn test có đơn chưa thanh toán; e2e đã dismiss modal và xác nhận stepper/thêm giỏ đúng.
