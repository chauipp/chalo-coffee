# Thiết kế: Nâng cấp thị giác màn đặt món khách hàng (2 giao diện A/B)

## Mục tiêu

Màn đặt món hiện tại (menu → chi tiết món → giỏ hàng/thanh toán → theo dõi đơn)
làm đúng chức năng nhưng thị giác "an toàn": card đơn giản, bo góc chuẩn, không
có điểm nhấn gây thích thú. Mục tiêu là khách quét QR vào thấy **muốn lướt, muốn
đặt món**, không chỉ đủ dùng.

Quyết định cuối: xây **2 ngôn ngữ hình ảnh** cho toàn bộ luồng khách hàng, có
nút chuyển đổi, mặc định mở bằng "Rực rỡ":

- **Điện ảnh (Cinematic)** — ảnh món full-bleed, overlay gradient, serif sang
  trọng, vàng đồng — cảm giác thực đơn quán specialty coffee cao cấp.
- **Rực rỡ (Playful)** — viền dày kiểu comic, đổ bóng cứng, nảy nhẹ khi xuất
  hiện, nút giỏ hàng nhấp nhô — cảm giác vui, dễ ghiền, hợp quán trẻ năng động.

Mockup tham khảo đã duyệt: xem lịch sử brainstorm phiên này (artifact 3 hướng
→ chọn Rực rỡ → quyết định làm cả 2 kèm toggle).

## Phạm vi

**Trong phạm vi** — áp dụng cho toàn bộ luồng khách hàng dưới
`src/app/(customer)/menu/[tableToken]/`:

1. Menu chính (danh mục, tìm kiếm, danh sách món) — `CustomerMenuClient.tsx`,
   `ProductCard.tsx` (phần list)
2. Chi tiết món (modal chọn modifier, ghi chú, số lượng) — `ProductCard.tsx`
   (phần modal), `ProductModifierPicker.tsx`
3. Giỏ hàng & thanh toán — `cart/page.tsx`, `checkout/` (`CheckoutSummary.tsx`,
   `CheckoutSessionPanel.tsx`)
4. Theo dõi đơn — `orders/page.tsx`, `orders/[orderId]/page.tsx`,
   `OrderCard.tsx`

**Ngoài phạm vi:**

- Giao diện admin, staff (không đổi)
- API/backend, logic nghiệp vụ (giá, modifier, trạng thái đơn) — chỉ đổi trình
  bày, không đổi dữ liệu hay hành vi cốt lõi
- Ảnh sản phẩm mới — dùng ảnh hiện có; sản phẩm chưa có ảnh vẫn có fallback
  thiết kế riêng (xem mục Cinematic bên dưới), không coi là thiếu sót
- Trang `/account` và các trang khách hàng ngoài luồng đặt món

## Kiến trúc & cơ chế chuyển đổi

Hai công tắc **độc lập, không chồng chéo**, kết hợp tự nhiên thành 4 tổ hợp:

1. **Sáng/Tối** — giữ nguyên `ThemeSwitch` và cơ chế class `.dark` trên
   `<html>` như hiện tại. Không đổi.
2. **Điện ảnh/Rực rỡ** — thêm mới, class thứ hai trên cùng gốc (ví dụ
   `data-order-theme="cinematic" | "playful"` trên `<html>` hoặc wrapper của
   route group khách hàng).

**State & lưu trữ:**

- Store mới `orderTheme.store.ts` (zustand + `persist` middleware, cùng pattern
  với các store hiện có), giá trị `"cinematic" | "playful"`, mặc định
  `"playful"`, lưu localStorage riêng (không đụng `auth.store`/`cart.store`).
- Lưu theo thiết bị (trình duyệt), không theo bàn/token — khách quay lại hay
  đổi bàn vẫn giữ lựa chọn giao diện.

**Đặt công tắc ở đâu:** chỉ trên header màn menu chính, cạnh `ThemeSwitch` hiện
có — đúng pattern đang có (`ThemeSwitch` hiện cũng chỉ xuất hiện ở
`CustomerMenuClient.tsx`, không có ở cart/checkout/orders). Các trang
cart/checkout/orders chỉ **đọc** `orderTheme.store` để tự áp style tương ứng,
không có UI chuyển đổi riêng.

**Tách component theo biến thể, không rẽ nhánh if/else trong 1 file:** mỗi màn
trong phạm vi tách thành 2 component trình bày dùng chung logic/state từ
component cha:

```
_components/
  ProductCard.Cinematic.tsx
  ProductCard.Playful.tsx
  ProductCard.tsx          # chọn biến thể theo orderTheme.store, không chứa JSX trình bày
```

Áp dụng cùng cấu trúc cho `CustomerMenuClient`, cart page, checkout components,
orders page/`OrderCard`. Lý do tách file: hai hướng khác nhau về **cấu trúc**
(Điện ảnh: ảnh full-bleed phủ chữ; Rực rỡ: card viền dày có thumbnail riêng),
không chỉ khác màu — nhét chung 1 JSX sẽ rối và khó sửa từng hướng độc lập.

**Token màu:** mỗi biến thể tự xử lý sáng/tối bằng quy ước `dark:` của Tailwind
đã có sẵn trong repo (`@custom-variant dark`), không tạo hệ token hoàn toàn mới
— chỉ mở rộng `globals.css` `@theme` thêm 2 bộ token phụ:

```css
--color-cine-gold-light: #7E4D20;   /* accent trên nền kem */
--color-cine-gold-dark:  #E0B379;   /* accent trên nền gần đen */
--color-play-pop:        #FF8A3D;   /* accent cam, dùng chung 2 chế độ */
--color-play-ink-light:  #2B2013;   /* viền/chữ trên nền kem */
--color-play-ink-dark:   #FDF6E8;   /* viền/chữ trên nền tím than */
--color-play-bg-dark:    #1B1330;   /* nền "chợ đêm" cho Rực rỡ-Tối */
```

`--color-brand-*` hiện có giữ nguyên, dùng cho các phần UI ngoài phạm vi (admin/
staff) và làm nền tảng an toàn nếu một component chưa kịp có biến thể riêng.

## Bảng màu 4 tổ hợp

| Tổ hợp | Nền | Chữ/viền chính | Accent |
|---|---|---|---|
| Điện ảnh · Sáng | `#FBF6EE` (kem) | `#2E1B0A` | `#7E4D20` (vàng đồng đậm) |
| Điện ảnh · Tối | `#14100C` (gần đen) | `#F3EADE` | `#E0B379` (vàng đồng sáng) |
| Rực rỡ · Sáng | `#FFF9EE` (kem) | `#2B2013` (viền/chữ đen ấm) | `#FF8A3D` (cam) |
| Rực rỡ · Tối | `#1B1330` (tím than) | `#FDF6E8` (viền/chữ kem) | `#FF8A3D` (cam, giữ nguyên) |

Nguyên tắc khi đổi sáng/tối trong mỗi biến thể:

- **Điện ảnh-Sáng** không phải "đảo màu" của bản tối — vẫn giữ ảnh full-bleed
  phủ gradient nâu ở đáy để chữ luôn đọc được trên ảnh, như thực đơn tạp chí ẩm
  thực cao cấp, không phải quán bar tối thu nhỏ độ tương phản.
- **Rực rỡ-Tối** không phải "dark mode xám buồn" — nền đổi hẳn sang tím than
  "chợ đêm", viền comic chuyển từ đen sang kem để vẫn nổi rõ trên nền tối, bóng
  đổ cứng đổi từ đen sang cam nhấn thay vì mất hẳn, giữ tinh thần vui nhộn.

Tương phản chữ/nền của cả 4 tổ hợp phải đạt WCAG AA (≥ 4.5:1 cho chữ thường),
kiểm khi implement — đặc biệt cặp cam-trên-tím-than và vàng đồng-trên-kem là
2 cặp có nguy cơ thấp tương phản nhất.

## Hành vi từng màn

### Menu chính

Dữ liệu/logic giữ nguyên (`CustomerMenuClient.tsx`): tìm kiếm, lọc danh mục,
gọi nhân viên, giỏ hàng, modal cảnh báo bàn đang có khách.

- **Điện ảnh:** card ảnh full-bleed cao ~168px, gradient tối phủ 40-100% chiều
  cao để chữ (tên serif + giá vàng đồng) đọc được khi đè lên ảnh. Chip danh mục
  là pill mờ nổi trên nền tối/kem. Hàng món **chỉ có nút "+"** tròn — bỏ hẳn
  stepper số lượng ở list để giữ card gọn gàng như ảnh trong thực đơn; số
  lượng chọn ở modal chi tiết khi cần > 1 hoặc có modifier. Sản phẩm không có
  ảnh vẫn hiện gradient duotone nâu cà phê + icon hơi nước làm nền — đây là
  trạng thái thiết kế có chủ đích, không phải fallback thiếu ảnh.
- **Rực rỡ:** giữ nguyên cấu trúc hiện tại của `ProductCard` (thumbnail vuông +
  tên + giá + stepper + nút "Thêm" trên cùng 1 hàng), đổi style: viền dày 2.5px
  màu ink, đổ bóng cứng `4px 4px 0`, card có animation nảy nhẹ khi vào viewport
  (stagger delay theo thứ tự), nút giỏ hàng nổi nhấp nhô liên tục (bounce loop
  nhẹ) mời khách bấm.

### Chi tiết món (modal)

Dữ liệu/logic giữ nguyên (`ProductModifierPicker`, validate modifier, tính giá,
ghi chú, số lượng) — chỉ đổi trình bày:

- **Điện ảnh:** ảnh phủ kín phần đầu modal (thay vì ảnh trong khung bo góc như
  hiện tại), tên món + giá đè lên ảnh bằng serif trắng. Nhóm modifier hiện dạng
  pill viền mảnh, chọn thì viền đổi màu vàng đồng. Thanh dưới cùng sticky nền
  kem/tối, nút "Thêm vào giỏ" pill vàng đồng.
- **Rực rỡ:** ảnh trong khung bo tròn viền comic 2.5px như card ngoài list.
  Modifier là chip to, khi chọn chuyển nền màu cam đặc + chữ trắng (không chỉ
  đổi viền). Nút "Thêm N vào giỏ" khi bấm có hiệu ứng squish (scale nhẹ xuống
  rồi bật lại) + một đợt confetti nhỏ (canvas, ít hạt, tắt hoàn toàn khi
  `prefers-reduced-motion: reduce`).

### Giỏ hàng & thanh toán

Logic/API giữ nguyên hoàn toàn (`cart.store`, `useCreateOrder`,
`useGetEstimatedWait`, luồng VietQR trong `checkout/`):

- **Điện ảnh:** danh sách món dạng hoá đơn mảnh — thumbnail tròn nhỏ, tên +
  modifier + ghi chú, đường kẻ mảnh màu vàng đồng phân cách từng dòng. Tổng
  tiền hiện lớn kiểu serif ở thanh sticky đáy. Nút xác nhận là pill vàng đồng.
- **Rực rỡ:** mỗi món là card viền dày comic như `ProductCard`, nút xoá là chip
  tròn "×" có hiệu ứng lắc nhẹ khi hover/focus. Tổng tiền có hiệu ứng số nhảy
  (roll animation) mỗi khi số lượng thay đổi. Nút xác nhận to, bo tròn, đổ bóng
  cứng, hơi nảy khi bấm.

### Theo dõi đơn hàng

Cùng nguồn trạng thái realtime (`useCustomerOrderEvents`, `useGetOrderByToken`)
— chỉ đổi cách hiển thị tiến độ trạng thái đơn:

- **Điện ảnh:** timeline dọc tối giản, mỗi mốc là chấm tròn — chấm của trạng
  thái đã qua tô đặc vàng đồng, trạng thái hiện tại có viền sáng dần
  (fade-in), nhãn trạng thái dùng serif.
- **Rực rỡ:** thanh tiến độ ngang kiểu "level" trò chơi — mỗi mốc là icon tròn
  (cốc → hơi nước → dấu tích), mốc đang active nảy nhẹ liên tục, khi đơn chuyển
  sang "Sẵn sàng/Đã phục vụ" có một hiệu ứng ăn mừng ngắn (confetti hoặc icon
  nảy mạnh 1 nhịp rồi thôi).

## Chuyển động & khả năng tiếp cận

- Mọi hiệu ứng nảy/confetti/số nhảy phải có nhánh tắt hoàn toàn khi
  `@media (prefers-reduced-motion: reduce)` — cùng cách `globals.css` đã làm
  với `.landing-steam`. Khi tắt: chuyển trạng thái tức thời, không mất thông
  tin (badge số lượng, trạng thái chọn modifier... vẫn hiển thị đúng, chỉ mất
  animation).
- 2 nút toggle (Điện ảnh/Rực rỡ, Sáng/Tối) là `<button>` thật, có
  `aria-pressed`, `aria-label`, focus ring rõ ràng khi tab bằng bàn phím —
  cùng chuẩn các nút hiện có (`aria-label="Gọi nhân viên"` v.v.).
- Nút "+"/"Thêm" trong cả 2 biến thể giữ nguyên vùng chạm tối thiểu 40×40px như
  hiện tại, không thu nhỏ vì lý do thẩm mỹ.

## Kiểm thử

- Playwright e2e (mở rộng `customer-menu-shortcut.spec.ts` hoặc file mới
  `customer-order-theme.spec.ts`):
  - Mặc định vào menu lần đầu là biến thể Rực rỡ.
  - Bấm toggle chuyển sang Điện ảnh, reload trang → vẫn giữ Điện ảnh (đọc
    đúng localStorage).
  - Toggle Sáng/Tối hoạt động độc lập với toggle Điện ảnh/Rực rỡ (4 tổ hợp đều
    render không lỗi, không đè token màu lẫn nhau).
  - Luồng đặt món đầy đủ (thêm giỏ → checkout → xem đơn) vẫn hoạt động đúng ở
    cả 2 biến thể — không chỉ test thị giác mà test hành vi (số lượng, tổng
    tiền, trạng thái đơn phải khớp dữ liệu thật).
- Theo `verifying-ui-with-playwright`: bắt buộc mở trình duyệt xem tận mắt cả
  4 tổ hợp trước khi báo hoàn thành, không chỉ dựa vào test xanh.

## Rủi ro & lưu ý khi triển khai

- Máy dev hiện bị cạn `fs.inotify.max_user_instances` (xem ghi chú dự án) —
  `next dev` có thể crash EMFILE khi nhiều tiến trình chạy song song. Khi cần
  xem trực tiếp trong worktree, ưu tiên `pnpm build` rồi chạy qua
  `.next/standalone/server.js` thay vì `next dev`/`next start`.
- Vì tách 2 component trình bày cho mỗi màn, cần cẩn thận không để hai bản lệch
  hành vi nghiệp vụ (vd. Điện ảnh bỏ stepper ở list nhưng vẫn phải gọi đúng
  `handleAddToCart` với `quantity=1` mặc định, không được thêm sai số lượng).
