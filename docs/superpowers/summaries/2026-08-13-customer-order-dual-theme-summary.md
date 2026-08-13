← [Spec](../specs/2026-08-13-customer-order-dual-theme-design.md) · [Plan](../plans/2026-08-13-customer-order-dual-theme.md)

# Nâng cấp thị giác màn đặt món khách hàng (2 giao diện A/B) — Kết quả

## Đã làm gì

- Toàn bộ luồng đặt món khách hàng (menu → chi tiết món → giỏ hàng → thanh
  toán → theo dõi đơn) giờ có 2 giao diện chuyển đổi được: **Điện ảnh**
  (ảnh full-bleed, serif, vàng đồng) và **Rực rỡ** (viền comic, đổ bóng cứng,
  nảy/confetti) — chọn qua nút mới cạnh nút Sáng/Tối, mặc định mở "Rực rỡ".
- Nút Điện ảnh/Rực rỡ và nút Sáng/Tối hoạt động hoàn toàn độc lập, kết hợp
  tự nhiên thành 4 tổ hợp; lựa chọn được lưu theo thiết bị (localStorage) và
  không gây hiện tượng "nhảy giao diện" khi tải trang (guard hydration đúng
  chuẩn của `auth.store.ts`).
- Thêm hiệu ứng nhỏ cho bản Rực rỡ: confetti khi thêm món vào giỏ và khi đơn
  chuyển sang "Sẵn sàng"/"Đã phục vụ"; card nảy nhẹ khi vào màn hình. Mọi hiệu
  ứng tắt hoàn toàn khi hệ điều hành yêu cầu giảm chuyển động.
- Kiểm tra & sửa tương phản màu theo chuẩn WCAG AA cho cả 4 tổ hợp (2 vòng
  final review phát hiện: nút cam/xanh lá chữ trắng không đủ tương phản ở
  bản Rực rỡ, chữ mờ không đủ tương phản ở bản Điện ảnh-Sáng — đã sửa hết).
- Thêm bộ e2e mới (`customer-order-theme.spec.ts`) kiểm mặc định là Rực rỡ,
  lưu lựa chọn sau khi tải lại trang, 4 tổ hợp không lỗi, và luồng thêm giỏ
  ở nhánh Điện ảnh (nhánh duy nhất khác hành vi tương tác, không được e2e cũ
  nào chạm tới).

## File chính

- `stores/orderTheme.store.ts` — store zustand lưu lựa chọn giao diện, có
  `isHydrated` để tránh lệch giữa render server/client.
- `components/shared/OrderThemeSwitch.tsx`, `ConfettiBurst.tsx` — công tắc
  A/B dùng chung, hiệu ứng ăn mừng nhỏ dùng lại ở nhiều nơi.
- `_components/ProductCard.{Cinematic,Playful}.tsx` + `useProductCardState.ts`
  — thẻ món & modal chi tiết, logic dùng chung qua hook, chỉ JSX khác nhau.
- `_components/CustomerMenuView.{Cinematic,Playful}.tsx`,
  `cart/_components/CartView.*`, `checkout/_components/CheckoutView.*` +
  `useCheckoutSession.ts`, `orders/_components/OrderCard.*`,
  `orders/_components/OrdersListView.*`,
  `orders/[orderId]/_components/{ServiceStepper,OrderDetailView}.*` — cùng
  pattern: wrapper mỏng chọn biến thể theo store, 2 file trình bày riêng.
- `chalo-fe/e2e/customer-order-theme.spec.ts` — e2e mới cho công tắc A/B.
- `components/shared/ui/Modal.tsx` — thêm prop `hideHeader` (mặc định
  `false`, không đổi hành vi mọi nơi khác đang dùng `Modal`).

## Khác với plan

- **Thêm Task 9** sau vòng final review đầu tiên: plan ban đầu chỉ theme
  `OrderCard`/`ServiceStepper`, bỏ sót phần khung 2 trang đơn hàng (header,
  banner, chi tiết món, thanh hành động) — người dùng chọn mở rộng phạm vi
  ngay thay vì để lại, nên đã thêm Task 9 để theme nốt.
- **2 vòng fix sau final review** (không nằm trong 9 task gốc): vòng 1 sửa
  tương phản/e2e/hydration; vòng 2 (sau khi Task 9 xong) sửa một lỗi thật —
  confetti khi thêm giỏ ở bản Rực rỡ **không bao giờ hiện được** (đặt nhầm
  bên trong `<Modal>`, trong khi đường thêm nhanh không mở modal) — cùng vài
  lỗi khác: 1 lỗi lint mới (`react-hooks/set-state-in-effect`) bị báo sai là
  sạch ở Task 1, logic tính QR/đếm giờ thanh toán bị copy trùng giữa 2 file
  giao diện (đã gộp lại thành hook `useCheckoutSession` dùng chung).
- Plan yêu cầu file `Modal.tsx` giữ nguyên hành vi cũ khi không truyền
  `hideHeader` — đúng như vậy, không có consumer nào khác của `Modal` bị ảnh
  hưởng (đã kiểm bằng review).

## Còn dở / cần lưu ý

- **Chưa có xác minh trực quan (Playwright) nào trên toàn nhánh.** Máy dev
  hiện có cổng 3000 bị một phiên Claude Code khác đang chiếm, và CORS backend
  chỉ mở cho đúng `http://localhost:3000`, nên không dựng được frontend riêng
  để chạy e2e thật hay mở trình duyệt xem. Đây là hạn chế môi trường thật,
  không phải bỏ qua chủ quan — cả 2 vòng final review đều nhấn mạnh điểm này,
  và vòng 2 tìm ra đúng 1 lỗi (confetti không hiện) mà chỉ đọc code không
  phát hiện được trước khi có review kỹ. **Trước khi coi tính năng này là
  "xong" thật, cần: (1) chạy `pnpm --dir chalo-fe exec playwright test
  e2e/customer-*.spec.ts` với backend + frontend thật, (2) mở trình duyệt tự
  tay lướt qua cả 4 tổ hợp** (Điện ảnh/Rực rỡ × Sáng/Tối) trên màn thực đơn,
  giỏ hàng, thanh toán, theo dõi đơn.
- Vài mục Minor không sửa (không chặn merge, ghi lại để biết): interface
  props của `CartView`/`CheckoutView`/`OrdersListView`/`OrderDetailView` khai
  lại inline ở cả 2 file mỗi màn thay vì dùng chung 1 file `.types.ts` như
  màn menu đã làm; `PayAllConfirmModal.tsx`/`PayConfirmModal.tsx` (2 dialog
  xác nhận thanh toán, không thuộc phạm vi feature này) vẫn dùng
  `bg-green-500 + text-white` — tương phản kém nhưng là pattern có từ trước
  tính năng này, không đụng tới để tránh mở rộng phạm vi ngoài dự kiến.
- Không có thay đổi backend/schema nào — toàn bộ là frontend.
