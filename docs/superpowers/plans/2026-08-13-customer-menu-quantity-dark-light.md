# Bỏ lựa chọn giao diện, chọn số lượng ngay trên menu và tách rõ sáng/tối — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Loại bỏ switch giao diện dư thừa, cho khách chọn số lượng ngay trên card món và làm light/dark mode khác biệt rõ ràng.

**Architecture:** Rút luồng khách về một component trình bày duy nhất và bỏ state A/B đã không còn giá trị. `useProductCardState` vẫn sở hữu số lượng tạm của card, còn card render stepper trước CTA để `quickAdd()` thêm đúng quantity; toàn bộ lớp nền/bề mặt dùng cặp light/dark tương phản rõ.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS v4, Zustand, Playwright.

## Global Constraints

- Không thay đổi API, schema, cart store, giá, modifier, checkout hoặc trạng thái đơn.
- Chỉ chỉnh luồng khách tại `chalo-fe/src/app/(customer)/menu/[tableToken]/` và asset logo công khai.
- Bỏ hoàn toàn UI/store `OrderThemeSwitch`/`orderTheme`; không còn test id `order-theme-*`.
- Card món không modifier: stepper `− quantity +` (1…`MAX_ITEM_QUANTITY`) và nút `Thêm`; CTA mới gọi `quickAdd()`.
- Card món có modifier luôn mở modal; quantity modal giữ hành vi hiện có.
- Light: `stone-50` + card white; dark: `stone-950` + card stone-900 + viền stone-700/800; CTA `brand-700` light / `brand-300` dark.
- Dùng logo gốc do người dùng cung cấp, chuẩn hoá JPEG thành `chalo-fe/public/brand/chalo-logo.jpg`; không tạo lại bằng AI.
- Phải mở browser kiểm light/dark trên desktop và 375×667 trước khi hoàn tất.

---

### Task 1

- [x] Task 1: Thay logo và bỏ cơ chế chọn giao diện

  **Files:**
  - Create: `chalo-fe/public/brand/chalo-logo.jpg`
  - Delete: `chalo-fe/public/brand/chalo-logo.png`
  - Delete: `chalo-fe/src/components/shared/OrderThemeSwitch.tsx`
  - Delete: `chalo-fe/src/stores/orderTheme.store.ts`
  - Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/CustomerMenuClient.tsx`
  - Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/CustomerMenuView.Cinematic.tsx`
  - Delete: `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/CustomerMenuView.Playful.tsx`
  - Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/{cart,checkout,orders}/page.tsx`
  - Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/page.tsx`

  **Interfaces:**
  - Consumes: menu view props/callbacks hiện có.
  - Produces: một luồng view duy nhất không phụ thuộc `OrderTheme` hay localStorage `chalo-order-theme`.

  - [ ] **Step 1: Cập nhật test thất bại về switch đã bị gỡ**

    Xoá các assertion/click `order-theme-*` trong `e2e/customer-order-theme.spec.ts`; đổi tên file/test sang menu quantity nếu phù hợp. Giữ helper lấy bàn/món và kiểm console/network.

  - [ ] **Step 2: Chuẩn hoá asset logo**

    Đổi tên JPEG nguồn từ `chalo-logo.png` thành `chalo-logo.jpg`, không chuyển mã lại. Kiểm `file chalo-fe/public/brand/chalo-logo.jpg` trả `JPEG image data`.

  - [ ] **Step 3: Bỏ switch/store và mọi lựa chọn conditional**

    Gỡ import, selector hydration và ternary `cinematic/playful` tại mọi page/component khách. Xoá wrapper Playful và component/store switch đã không còn consumer. Không động cart store hay query hooks.

  - [ ] **Step 4: Đặt logo ở header menu**

    Thay ô `CH` bằng `<img src="/brand/chalo-logo.jpg" alt="Chalo Coffee" />`, khung tròn `object-contain`, viền mảnh stone ở light/brand-stone ở dark; giữ `Link`, aria-label và kích thước chạm hiện có.

  - [ ] **Step 5: Chạy type/build**

    Run: `pnpm --dir chalo-fe build`
    Expected: TypeScript không còn import hoặc type `OrderTheme` chết.

  - [ ] **Step 6: Commit**

    ```bash
    git add chalo-fe/public/brand chalo-fe/src chalo-fe/e2e
    git commit -m "refactor: remove customer order theme switch"
    ```

### Task 2

- [x] Task 2: Thêm stepper số lượng trực tiếp trên card món

  **Files:**
  - Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/ProductCard.Cinematic.tsx`
  - Delete: `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/ProductCard.Playful.tsx`
  - Modify: `chalo-fe/e2e/customer-order-theme.spec.ts` (hoặc file đã đổi tên)

  **Interfaces:**
  - Consumes: `quantity`, `setQuantity`, `quickAdd`, `MAX_ITEM_QUANTITY`, `hasModifiers` từ `useProductCardState`.
  - Produces: món không modifier có controls `Giảm số lượng`, số hiện tại, `Tăng số lượng` và CTA `Thêm`; modifier vẫn gọi `openDetail`.

  - [ ] **Step 1: Viết e2e tăng số lượng trước khi thêm**

    Trên món không modifier: bấm `Tăng số lượng` một lần, xác nhận card hiện `2`, bấm CTA `Thêm`, rồi xác nhận badge giỏ là `2` và trang cart có quantity `2`.

  - [ ] **Step 2: Render stepper card cho món không modifier**

    Dùng `setQuantity((q) => q - 1/+1)` với disabled ở 1 và `MAX_ITEM_QUANTITY`; chặn propagation để click controls không mở modal. CTA `Thêm` gọi `quickAdd`, sau đó quantity reset về 1 do hook hiện có.

  - [ ] **Step 3: Giữ modifier flow**

    Với `hasModifiers`, chỉ hiển thị CTA `Tuỳ chọn` (hoặc `Thêm`) gọi `openDetail`; không hiện stepper card để tránh quantity không đi cùng lựa chọn modifier.

  - [ ] **Step 4: Chạy test customer menu**

    Run: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:<port> pnpm --dir chalo-fe exec playwright test e2e/customer-order-theme.spec.ts`
    Expected: test chọn quantity, thêm giỏ và modifier flow xanh.

  - [ ] **Step 5: Commit**

    ```bash
    git add 'chalo-fe/src/app/(customer)/menu/[tableToken]/_components/ProductCard.Cinematic.tsx' chalo-fe/e2e/customer-order-theme.spec.ts
    git commit -m "feat: choose menu item quantity before adding"
    ```

### Task 3

- [x] Task 3: Tăng tương phản hệ light/dark và kiểm chứng browser

  **Files:**
  - Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/**/_components/*.tsx`
  - Modify: `docs/superpowers/plans/2026-08-13-customer-menu-quantity-dark-light.md`
  - Create: `docs/superpowers/summaries/2026-08-13-customer-menu-quantity-dark-light-summary.md`

  **Interfaces:**
  - Consumes: component khách đã hội tụ từ Task 1/2.
  - Produces: dark mode có nền/bề mặt/header/sticky bar tách bạch, không chỉ khác viền.

  - [ ] **Step 1: Chuẩn hoá lớp dark nền và surface**

    Mọi root là `bg-stone-50 dark:bg-stone-950`; header/sticky `dark:bg-stone-950`; card/surface `bg-white dark:bg-stone-900`; border `border-stone-200 dark:border-stone-700/800`; CTA `bg-brand-700 dark:bg-brand-300 dark:text-brand-950`.

  - [ ] **Step 2: Build và unit test**

    Run: `pnpm --dir chalo-fe test:unit && pnpm --dir chalo-fe build`
    Expected: 23 unit tests và build xanh.

  - [ ] **Step 3: Kiểm UI Playwright**

    Dựng standalone từ thư mục `.next/standalone` sau khi copy `.next/static`; mở menu desktop và 375×667 ở light/dark. Dismiss occupied modal, kiểm logo, stepper, CTA, card/nền; mở modal và giỏ. Xác nhận console/network sạch.

  - [ ] **Step 4: Tick plan, viết summary và commit**

    Tick task ngay khi hoàn thành. Summary liên kết spec/plan và có `Đã làm gì`, `File chính`, `Khác với plan`, `Còn dở / cần lưu ý` dựa trên diff/kết quả test.

    ```bash
    git add docs/superpowers
    git commit -m "docs: record customer quantity and theme refresh"
    ```

## Kết quả

[Xem kết quả thực tế](../summaries/2026-08-13-customer-menu-quantity-dark-light-summary.md).
