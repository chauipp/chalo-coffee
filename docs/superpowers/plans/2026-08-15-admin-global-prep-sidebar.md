# Global Admin Prep Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa PrepDock thành right sidebar desktop dùng chung cho toàn bộ `/admin/*`, mở/đóng như split-pane staff mà không thay đổi mobile.

**Architecture:** `AdminPrepSidebarLayout` sở hữu state và `SplitPane` ở cấp `AdminLayout`. Khi đóng, component render rail dọc ở mép phải; khi mở, `SplitPane` render `children` bên trái và `PrepDock` bên phải. Route `/admin/orders` chỉ render nội dung vận hành/lịch sử, không còn sở hữu dock.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, Playwright, Node test runner.

## Global Constraints

- Chỉ thay đổi desktop (`md` trở lên); mobile không thay đổi UX hoặc layout.
- Rail và dock xuất hiện trên mọi route dưới `/admin/*`, không chỉ `/admin/orders`.
- Dock mở phải chiếm một pane thực, cao bằng vùng làm việc admin; không phủ overlay lên nội dung.
- Dùng `admin-prep-visible:v1` và `admin-prep-split:v1`; không dùng hoặc thay đổi `staff-prep-split`.
- Staff giữ PrepDock thường trực và hành vi hiện tại.
- Không đổi API, backend, SSE, enum order hoặc auth.

---

## - [ ] Task 1: Tạo shell right sidebar desktop toàn cục

**Files:**
- Create: `chalo-fe/src/app/(admin)/_components/AdminPrepSidebarLayout.tsx`
- Create: `chalo-fe/src/app/(admin)/_components/adminPrepSidebarState.ts`
- Create: `chalo-fe/src/app/(admin)/_components/adminPrepSidebarState.test.mts`
- Modify: `chalo-fe/src/app/(staff)/_components/PrepDock.tsx`
- Modify: `chalo-fe/src/app/(staff)/_components/PrepStation.tsx`

**Interfaces:**
- `readAdminPrepVisible(storage)` returns `true` only when `admin-prep-visible:v1` is string `"true"`.
- `AdminPrepSidebarLayout({ children })` renders a desktop rail when closed and `SplitPane` plus `PrepDock` when open.
- `PrepDock` accepts optional `onToggleVisible`; `PrepStation` renders the “Thu gọn khu pha chế” control only when it receives that callback.

- [ ] **Step 1: Viết test đỏ** cho `readAdminPrepVisible`: storage trống và `staff-prep-split` không mở admin dock; `"true"` mở dock; `"false"` đóng dock.

- [ ] **Step 2: Chạy test đỏ**

  Run: `node --test --experimental-strip-types src/app/(admin)/_components/adminPrepSidebarState.test.mts`

  Expected: FAIL vì module state chưa tồn tại.

- [ ] **Step 3: Tạo state helper và shell layout**

  ```tsx
  <SplitPane
    storageKey="admin-prep-split:v1"
    className="hidden h-full md:flex"
    left={children}
    right={(controls) => <PrepDock {...controls} onToggleVisible={toggle} />}
  />
  ```

  Khi đóng, render button rail có text “Pha chế”, `aria-expanded={false}` và hit target tối thiểu `w-10`. Khi mở, `PrepDock` có nút `data-testid="prep-visibility-toggle"` với nhãn “Thu gọn khu pha chế”. Không render rail/dock global ở mobile.

- [ ] **Step 4: Chạy test state và typecheck**

  Run: `node --test --experimental-strip-types src/app/(admin)/_components/adminPrepSidebarState.test.mts && npx tsc --noEmit --pretty false`

  Expected: PASS.

- [ ] **Step 5: Commit**

  Run: `git add chalo-fe/src/app/(admin)/_components chalo-fe/src/app/(staff)/_components/PrepDock.tsx chalo-fe/src/app/(staff)/_components/PrepStation.tsx && git commit -m "feat: add global admin prep sidebar shell"`

## - [ ] Task 2: Gắn shell vào AdminLayout và gỡ dock cục bộ ở Orders

**Files:**
- Modify: `chalo-fe/src/app/(admin)/layout.tsx`
- Modify: `chalo-fe/src/app/(admin)/admin/orders/page.tsx`
- Delete: `chalo-fe/src/app/(admin)/admin/orders/_components/AdminOrdersOperationsLayout.tsx`
- Delete: `chalo-fe/src/app/(admin)/admin/orders/_components/AdminPrepDockDrawer.tsx`
- Delete: `chalo-fe/src/app/(admin)/admin/orders/_components/adminPrepState.ts`
- Delete: `chalo-fe/src/app/(staff)/_components/SplitPane.admin-state.test.mts`

**Interfaces:**
- `AdminLayout` passes its existing `main` content as `children` to `AdminPrepSidebarLayout` on desktop.
- `AdminOrdersPage` renders `AdminOrdersOperations` directly in operations mode.

- [ ] **Step 1: Viết test đỏ** cho desktop rail xuất hiện ở `/admin/dashboard` và `/admin/orders`, còn khi click rail thì `split-resizer` và heading “Đang pha chế” xuất hiện.

- [ ] **Step 2: Chạy test đỏ**

  Run: `PLAYWRIGHT_BASE_URL=http://localhost:3002 npx playwright test e2e/admin-prep-sidebar.spec.ts --project=chromium`

  Expected: FAIL vì rail chưa ở cấp layout admin.

- [ ] **Step 3: Chuyển ownership lên layout**

  - Bọc desktop main của `AdminLayout` bằng `AdminPrepSidebarLayout` để split pane cao bằng main viewport.
  - Giữ header mobile và `MobileAdminNav` nguyên trạng.
  - Xóa wrapper dock khỏi `/admin/orders`; mode operations render board trực tiếp.
  - Xóa state/test/component cục bộ cũ để không còn hai source of truth.

- [ ] **Step 4: Chạy typecheck**

  Run: `npx tsc --noEmit --pretty false`

  Expected: PASS, không còn import tới component dock cục bộ ở orders.

- [ ] **Step 5: Commit**

  Run: `git add chalo-fe/src/app/'(admin)' chalo-fe/src/app/'(staff)'/_components/SplitPane.admin-state.test.mts && git commit -m "refactor: host prep dock in admin layout"`

## - [ ] Task 3: Kiểm UI desktop và regression staff

**Files:**
- Create: `chalo-fe/e2e/admin-prep-sidebar.spec.ts`
- Modify: `chalo-fe/e2e/admin-orders-mobile.spec.ts`

**Interfaces:**
- E2E desktop seeds an admin session, visits dashboard and orders, opens rail, verifies pane/resizer, closes from `prep-visibility-toggle`, and confirms rail returns.
- Mobile test asserts the new global desktop rail is not rendered at 375×667; it does not assert a replacement mobile interaction.

- [ ] **Step 1: Viết assertions desktop**

  ```ts
  await page.goto('/admin/dashboard');
  await page.getByRole('button', { name: 'Pha chế' }).click();
  await expect(page.getByTestId('split-resizer')).toBeVisible();
  await page.getByTestId('prep-visibility-toggle').click();
  await expect(page.getByRole('button', { name: 'Pha chế' })).toBeVisible();
  ```

- [ ] **Step 2: Kiểm tra staff regression**

  Run: `PLAYWRIGHT_BASE_URL=http://localhost:3002 npx playwright test e2e/admin-prep-sidebar.spec.ts e2e/staff-payment-default-scope.spec.ts --project=chromium`

  Expected: PASS; staff vẫn có PrepDock thường trực, admin rail/dock hoạt động trên dashboard và orders.

- [ ] **Step 3: Kiểm UI bằng browser thật**

  - Desktop 1440×900: mở dashboard → rail → mở dock → kéo splitter → thu dock.
  - Desktop 1440×900: mở orders → rail → mở dock; xác nhận nội dung bên trái co lại thay vì bị che.
  - Mobile 375×667: xác nhận rail desktop không xuất hiện và không có thay đổi UX mới.

- [ ] **Step 4: Commit**

  Run: `git add chalo-fe/e2e && git commit -m "test: verify global admin prep sidebar"`

## Kết quả

Sau khi toàn bộ task được tick, viết summary tại [2026-08-15-admin-global-prep-sidebar-summary.md](../summaries/2026-08-15-admin-global-prep-sidebar-summary.md), trỏ ngược về spec và plan.
