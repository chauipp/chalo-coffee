← [Spec](../specs/2026-08-13-customer-order-minimal-theme-design.md) · [Plan](../plans/2026-08-13-customer-order-minimal-theme.md)

# Làm mới tối giản giao diện đặt món khách hàng — Kết quả

## Đã làm gì

- Hợp nhất hai lựa chọn giao diện đặt món về cùng một hệ tối giản: nền stone
  trung tính, bề mặt trắng/charcoal và một accent espresso cho CTA.
- Loại bỏ tím/cam carnival, viền comic, bóng cứng, serif trang trí, confetti
  và chuyển động nảy khỏi menu, modal món, giỏ, thanh toán và theo dõi đơn.
- Giữ nguyên hai giá trị store cũ để lựa chọn khách đã lưu vẫn hoạt động; nhãn
  đổi thành `Tiêu chuẩn` và `Tập trung` thay vì hứa hẹn hai phong cách khác nhau.
- Rút các component Playful về tái sử dụng component còn lại, tránh hai nhánh
  tiếp tục lệch style hoặc hành vi nghiệp vụ.
- Xác minh build, 23 unit tests và 4 Playwright e2e customer-order-theme xanh;
  đã mở trực tiếp menu ở mobile 375×667 trong sáng/tối.

## File chính

- `chalo-fe/src/app/globals.css` — gỡ token và animation carnival không còn dùng.
- `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/CustomerMenuView.Cinematic.tsx` — menu/header/card action theo hệ neutral espresso.
- `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/ProductCard.Cinematic.tsx` — card và modal món phẳng, rõ cấp bậc đọc.
- `chalo-fe/src/app/(customer)/menu/[tableToken]/**/_components/*.Playful.tsx` — các lựa chọn cũ tái sử dụng giao diện thống nhất.
- `chalo-fe/src/components/shared/OrderThemeSwitch.tsx` — copy trung tính, vẫn giữ test id và persistence.

## Khác với plan

- Dispatcher subagent gửi payload rỗng ở hai lượt, nên không thể thực hiện vòng implementer/reviewer tự động; phần triển khai được làm trực tiếp trong worktree.
- E2e cần server frontend đang chạy. Khi chạy server standalone phải khởi động từ thư mục `.next/standalone` và copy `.next/static` vào đó; chạy từ repo root khiến asset client 404 và ảnh trang trắng.

## Còn dở / cần lưu ý

- `pnpm --dir chalo-fe lint` vẫn lỗi do 14 lỗi ESLint đã có sẵn ở admin/staff/hooks ngoài phạm vi thay đổi; build TypeScript vẫn xanh.
- Playwright đã kiểm menu trên browser thật và luồng e2e toàn bộ menu/toggle/giỏ. Các màn checkout/đơn dùng cùng hệ component đã build xanh, nhưng không có dữ liệu đơn mới để chụp trực tiếp mọi trạng thái thanh toán trong phiên này.
