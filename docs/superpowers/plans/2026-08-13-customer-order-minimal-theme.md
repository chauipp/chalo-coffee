# Làm mới tối giản giao diện đặt món khách hàng — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa toàn bộ luồng đặt món khách hàng về một giao diện tối giản, hiện đại, dễ đọc ở cả sáng và tối mà không đổi nghiệp vụ.

**Architecture:** Giữ store và công tắc A/B để tương thích localStorage, nhưng làm hai nhánh trình bày hội tụ về cùng hệ neutral stone + accent espresso. Các wrapper vẫn chọn theo store, còn các component biến thể sẽ dùng cùng cấu trúc/lớp trình bày để không phát sinh khác biệt thị giác hay hành vi.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS v4, Zustand, Playwright.

## Global Constraints

- Không thay đổi API, schema, store nghiệp vụ, tính giá, modifier hoặc luồng đặt/thanhtoán đơn.
- Chỉ chỉnh luồng dưới `chalo-fe/src/app/(customer)/menu/[tableToken]/`; không đổi admin, staff, account.
- Bản sáng dùng stone/ivory; bản tối dùng stone charcoal; CTA dùng `brand-700` ở sáng và `brand-300/400` ở tối.
- Loại bỏ `pop-*`, `carnival*`, viền comic, bóng đổ cứng, serif trang trí, confetti và chuyển động nảy trong luồng này.
- Cả hai lựa chọn `playful`/`cinematic` vẫn render, lưu lựa chọn và hoạt động như nhau; `ThemeSwitch` sáng/tối vẫn độc lập.
- Mọi chữ thường và CTA phải đạt WCAG AA; UI phải được mở xem trực tiếp bằng Playwright trước khi hoàn tất.

---

## File structure

- `chalo-fe/src/app/globals.css` — bỏ token/animation trang trí không còn dùng và giữ token brand/stone dùng chung.
- `chalo-fe/src/components/shared/OrderThemeSwitch.tsx` — đổi copy để công tắc không hứa hẹn hai phong cách trái ngược.
- `chalo-fe/src/components/shared/ConfettiBurst.tsx` — xóa nếu không còn consumer.
- `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/{CustomerMenuView,ProductCard}.{Cinematic,Playful}.tsx` — menu và modal món theo hệ tối giản thống nhất.
- `chalo-fe/src/app/(customer)/menu/[tableToken]/{cart,checkout}/_components/*.{Cinematic,Playful}.tsx` — giỏ và thanh toán theo cùng hệ bề mặt/card/CTA.
- `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/**/_components/*.{Cinematic,Playful}.tsx` — danh sách và chi tiết đơn theo cùng hệ bề mặt/trạng thái.
- `chalo-fe/e2e/customer-order-theme.spec.ts` — bảo vệ tương thích toggle và luồng thêm giỏ sau khi giao diện hội tụ.

### Task 1

- [x] Task 1: Chuẩn hóa token nền tảng và menu/modal món

  **Files:**
  - Modify: `chalo-fe/src/app/globals.css`
  - Modify: `chalo-fe/src/components/shared/OrderThemeSwitch.tsx`
  - Modify: `chalo-fe/src/components/shared/ConfettiBurst.tsx` (hoặc xóa khi không còn import)
  - Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/CustomerMenuView.{Cinematic,Playful}.tsx`
  - Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/ProductCard.{Cinematic,Playful}.tsx`

  **Interfaces:**
  - Consumes: `CustomerMenuViewProps`, `ProductDto`, `useProductCardState`, `OrderThemeSwitch` hiện có.
  - Produces: Hai nhánh menu/modal cùng cấu trúc tương tác, giữ nguyên tất cả `data-testid`, `aria-label` và callback hiện hữu.

  - [ ] **Step 1: Bổ sung kiểm tra hồi quy e2e cho hai mode cùng trải nghiệm menu**

    Trong `customer-order-theme.spec.ts`, sau vòng đổi từng `orderTheme`, kiểm `product-card-*` hiển thị và CTA giỏ vẫn truy cập được. Giữ test persistence hiện hữu để khóa tương thích localStorage.

  - [ ] **Step 2: Chạy test để xác nhận trạng thái trước khi sửa**

    Run: `pnpm --dir chalo-fe exec playwright test e2e/customer-order-theme.spec.ts`
    Expected: test hiện có xanh hoặc ghi nhận rõ blocker hạ tầng/backend trước khi thay UI.

  - [ ] **Step 3: Chỉnh token và loại bỏ trang trí không còn thuộc hệ mới**

    Trong `globals.css`, gỡ `--color-pop-*`, `--color-carnival*`, `@keyframes confetti-burst`, `card-in`, `badge-pop` khi không còn consumer. Giữ `brand-*` làm espresso accent, `stone-*` làm neutral; không chỉnh token dùng chung admin/staff.

  - [ ] **Step 4: Hội tụ hai biến thể menu và modal**

    Đổi mọi nền carnival/gradient/viền 2px/bóng cứng/serif sang `bg-stone-50 dark:bg-stone-950`, card `bg-white dark:bg-stone-900`, viền `border-stone-200 dark:border-stone-800`, chữ stone và CTA `bg-brand-700 dark:bg-brand-300`. Bỏ `ConfettiBurst`, bounce và badge animation; giữ nút, modal, số lượng, modifier và ảnh món.

  - [ ] **Step 5: Cập nhật nhãn công tắc**

    Đổi label hiển thị của `OrderThemeSwitch` thành hai lựa chọn trung tính (ví dụ `Tiêu chuẩn` và `Tập trung`) hoặc giữ biểu tượng, nhưng không dùng copy gợi hứa hẹn "Rực rỡ"/"Điện ảnh". Không đổi test id hoặc giá trị store.

  - [ ] **Step 6: Chạy lint và test e2e liên quan**

    Run: `pnpm --dir chalo-fe lint && pnpm --dir chalo-fe exec playwright test e2e/customer-order-theme.spec.ts`
    Expected: không lỗi lint; test toggle, reload, light/dark và thêm giỏ xanh.

  - [ ] **Step 7: Commit**

    ```bash
    git add chalo-fe/src/app/globals.css chalo-fe/src/components/shared/OrderThemeSwitch.tsx chalo-fe/src/components/shared/ConfettiBurst.tsx 'chalo-fe/src/app/(customer)/menu/[tableToken]/_components' chalo-fe/e2e/customer-order-theme.spec.ts
    git commit -m "refactor: simplify customer menu theme"
    ```

### Task 2

- [x] Task 2: Chuẩn hóa giỏ hàng và checkout

  **Files:**
  - Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/cart/_components/CartView.{Cinematic,Playful}.tsx`
  - Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/checkout/_components/CheckoutView.{Cinematic,Playful}.tsx`

  **Interfaces:**
  - Consumes: props `CartView`/`CheckoutView` hiện có, `useCheckoutSession` không đổi.
  - Produces: Hai mode có cùng CTA, card món, QR/session panel và hành vi submit.

  - [ ] **Step 1: Đọc toàn bộ class đang dùng trước khi thay**

    Run: `rg -n 'pop-|carnival|border-2|shadow-|font-serif|animate-' 'chalo-fe/src/app/(customer)/menu/[tableToken]/cart' 'chalo-fe/src/app/(customer)/menu/[tableToken]/checkout'`
    Expected: danh sách đầy đủ mọi lớp cần thay, không chạm callback/logic hook.

  - [ ] **Step 2: Thay các lớp trang trí của giỏ hàng**

    Dùng bề mặt trắng/stone-900, border 1px stone, ảnh bo vừa, input viền mảnh và CTA espresso; bỏ shadow cứng, viền comic, total animation và nền carnival. Giữ `aria-label` tăng/giảm/xóa, props và layout sticky đáy.

  - [ ] **Step 3: Thay các lớp trang trí của checkout**

    Đưa preview, VietQR, bộ đếm, tổng tiền và CTA về cùng token neutral/espresso; không sửa thời hạn, polling, điều kiện thanh toán hay navigation.

  - [ ] **Step 4: Chạy kiểm thử tĩnh**

    Run: `pnpm --dir chalo-fe lint && pnpm --dir chalo-fe test:unit`
    Expected: ESLint và toàn bộ Node unit tests xanh.

  - [ ] **Step 5: Commit**

    ```bash
    git add 'chalo-fe/src/app/(customer)/menu/[tableToken]/cart/_components' 'chalo-fe/src/app/(customer)/menu/[tableToken]/checkout/_components'
    git commit -m "refactor: simplify customer cart and checkout theme"
    ```

### Task 3

- [x] Task 3: Chuẩn hóa danh sách và chi tiết đơn

  **Files:**
  - Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/_components/{OrderCard,OrdersListView}.{Cinematic,Playful}.tsx`
  - Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/{OrderDetailView,ServiceStepper}.{Cinematic,Playful}.tsx`

  **Interfaces:**
  - Consumes: `status-meta.ts`, props view và state page hiện hữu.
  - Produces: Trạng thái đơn rõ ràng bằng màu/typography nhẹ, không confetti hay game-level/comic visual.

  - [ ] **Step 1: Xác định mọi style phụ thuộc biến thể**

    Run: `rg -n 'pop-|carnival|border-2|shadow-|font-serif|animate-|Confetti' 'chalo-fe/src/app/(customer)/menu/[tableToken]/orders'`
    Expected: không có phụ thuộc nghiệp vụ nào bị lẫn với class thị giác.

  - [ ] **Step 2: Làm mới card và danh sách đơn**

    Thay card/empty state/header bằng bề mặt neutral, border mảnh và CTA espresso. Thể hiện trạng thái bằng badge màu nhạt có text tương phản, không viền dày/bóng cứng.

  - [ ] **Step 3: Làm mới chi tiết đơn và stepper**

    Chuyển timeline/stepper sang chấm, đường và label tinh gọn; bỏ nảy/confetti. Giữ nguyên trạng thái realtime, modal xác nhận và event trigger.

  - [ ] **Step 4: Chạy lint và e2e customer order**

    Run: `pnpm --dir chalo-fe lint && pnpm --dir chalo-fe exec playwright test e2e/customer-order-theme.spec.ts e2e/customer-checkout.spec.ts`
    Expected: không lỗi lint; luồng menu → giỏ → checkout không hồi quy.

  - [ ] **Step 5: Commit**

    ```bash
    git add 'chalo-fe/src/app/(customer)/menu/[tableToken]/orders'
    git commit -m "refactor: simplify customer order tracking theme"
    ```

### Task 4

- [x] Task 4: Kiểm chứng trình duyệt, hoàn tất tài liệu

  **Files:**
  - Modify: `docs/superpowers/plans/2026-08-13-customer-order-minimal-theme.md`
  - Create: `docs/superpowers/summaries/2026-08-13-customer-order-minimal-theme-summary.md`

  **Interfaces:**
  - Consumes: toàn bộ UI đã hội tụ ở Task 1–3 và test ids có sẵn.
  - Produces: bằng chứng UI tại browser và summary kết quả thực tế.

  - [ ] **Step 1: Dựng frontend và ghi lại URL/cổng thực tế**

    Run (ưu tiên khi watcher thiếu tài nguyên): `pnpm --dir chalo-fe build`, sau đó chạy server standalone theo cấu hình repo; nếu dùng dev server, ghi chính xác cổng Next báo ra.

  - [ ] **Step 2: Dùng Playwright xem menu và modal ở sáng/tối**

    Vào một URL `/menu/<tableToken>` hợp lệ, đổi light/dark và hai lựa chọn order-theme. Mở chi tiết món, đổi modifier/số lượng, thêm giỏ. Kiểm desktop và viewport 375×667; lấy snapshot và ảnh cho bố cục.

  - [ ] **Step 3: Dùng Playwright xem giỏ, checkout và đơn**

    Đi giỏ → checkout → màn đơn trong light/dark. Xác nhận CTA nhìn rõ, không tràn ngang, console không error và API không có 4xx/5xx ngoài tình huống dự kiến.

  - [ ] **Step 4: Chạy full verification**

    Run: `pnpm --dir chalo-fe lint && pnpm --dir chalo-fe test:unit && pnpm --dir chalo-fe exec playwright test e2e/customer-order-theme.spec.ts`
    Expected: tất cả xanh; nếu e2e không chạy vì backend/môi trường, ghi rõ lệnh, lỗi và phần đã kiểm qua browser.

  - [ ] **Step 5: Tick plan và viết summary thực tế**

    Tick từng Task khi kiểm xong. Tạo summary có đầu trang liên kết đến spec và plan; đủ bốn mục `Đã làm gì`, `File chính`, `Khác với plan`, `Còn dở / cần lưu ý`, dựa trên diff và kết quả kiểm chứng.

  - [ ] **Step 6: Commit**

    ```bash
    git add docs/superpowers/specs/2026-08-13-customer-order-minimal-theme-design.md docs/superpowers/plans/2026-08-13-customer-order-minimal-theme.md docs/superpowers/summaries/2026-08-13-customer-order-minimal-theme-summary.md
    git commit -m "docs: record customer minimal theme refresh"
    ```

## Kết quả

[Xem kết quả thực tế](../summaries/2026-08-13-customer-order-minimal-theme-summary.md).
