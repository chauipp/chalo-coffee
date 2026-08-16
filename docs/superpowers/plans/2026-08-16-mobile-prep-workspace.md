# Mobile Prep Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cung cấp màn Pha chế mobile trực tiếp cho Staff và Admin, dùng chung dữ liệu realtime và thao tác tick ly hiện có.

**Architecture:** Tách `PrepDock` thành một `PrepWorkspace` tự sở hữu active-order query, mutation và lọc đơn `PREPARING`; dock desktop và hai route mới cùng dùng workspace này. Navigation chỉ thêm route Pha chế vào danh sách điều hướng, không sao chép logic pha chế hoặc API.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query, Tailwind CSS, Node test, Playwright.

## Global Constraints

- Không đổi endpoint, quyền, order status, grouping hay optimistic mutation pha chế hiện có.
- Workspace chỉ query/poll khi `enabled === true`; mobile route khác không mount workspace.
- Staff mobile: Đơn hàng, POS, Pha chế, Bàn, Khác; Chốt ca và Đăng xuất nằm trong Khác.
- Admin mobile: Dashboard, Thực đơn, Đơn hàng, Pha chế, Khác.
- Desktop dock/rail giữ nguyên hành vi và kích thước.
- UI phải kiểm bằng Playwright ở 375×667, đồng thời kiểm console/network không có lỗi ngoài fixture.

---

## File structure

- `chalo-fe/src/app/(staff)/_components/PrepWorkspace.tsx`: query/mutation pha chế dùng chung và render `PrepStation`.
- `chalo-fe/src/app/(staff)/_components/PrepDock.tsx`: adapter desktop mỏng, chỉ render workspace.
- `chalo-fe/src/app/(staff)/staff/prep/page.tsx`: màn Staff Pha chế full-content.
- `chalo-fe/src/app/(admin)/admin/prep/page.tsx`: màn Admin Pha chế full-content.
- `chalo-fe/src/constants/routes.ts`: hằng route STAFF.PREP và ADMIN.PREP.
- `chalo-fe/src/app/(staff)/staff/_components/header.config.ts`, `.../MobileStaffNav.tsx`: cấu hình nav mobile Staff và sheet Khác, không đổi sidebar desktop.
- `chalo-fe/src/app/(admin)/_components/sidebar.config.ts`, `.../MobileAdminNav.tsx`: nav Admin desktop/mobile.
- `chalo-fe/e2e/mobile-prep-workspace.spec.ts`: fixture Staff/Admin, route, click/toggle và request lifecycle.
- `docs/superpowers/summaries/2026-08-16-mobile-prep-workspace-summary.md`: kết quả sau khi hoàn thành.

- [ ] Task 1: Tách workspace pha chế và tạo hai route

**Files:**
- Create: `chalo-fe/src/app/(staff)/_components/PrepWorkspace.tsx`
- Modify: `chalo-fe/src/app/(staff)/_components/PrepDock.tsx`
- Create: `chalo-fe/src/app/(staff)/staff/prep/page.tsx`
- Create: `chalo-fe/src/app/(admin)/admin/prep/page.tsx`
- Modify: `chalo-fe/src/constants/routes.ts`
- Test: `chalo-fe/e2e/mobile-prep-workspace.spec.ts`

**Interfaces:**
- Produces `PrepWorkspace({ enabled }: { enabled: boolean })`.
- Consumes `useGetActiveOrder({ enabled, refetchInterval: 10_000 })`, `useSetItemPrepared`, `useUpdateOrderStatus`, `PrepStation`.
- Routes render `<PrepWorkspace enabled />`; `PrepDock` renders the same component when desktop dock is visible.

- [ ] **Step 1: Write the failing browser route test**

```ts
await page.goto('/staff/prep');
await expect(page.getByRole('heading', { name: 'Pha chế' })).toBeVisible();
await page.getByTestId('prep-mode-table').click();
await page.goto('/admin/prep');
await expect(page.getByRole('heading', { name: 'Pha chế' })).toBeVisible();
```

- [ ] **Step 2: Run the focused test and verify route failure**

Run: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3015 pnpm --dir chalo-fe exec playwright test e2e/mobile-prep-workspace.spec.ts --project=chromium --reporter=line`

Expected: FAIL because `/staff/prep` and `/admin/prep` do not exist.

- [ ] **Step 3: Extract the shared workspace and add routes**

```tsx
export function PrepWorkspace({ enabled }: { enabled: boolean }) {
  const { data: activeOrders } = useGetActiveOrder({ enabled, refetchInterval: 10_000 });
  const preparingOrders = useMemo(() => (activeOrders ?? []).filter((order) => order.status === 'PREPARING').sort(byCreatedAsc), [activeOrders]);
  return <PrepStation orders={preparingOrders} onToggleUnit={handleToggleUnit} onDropOrder={handleDropOrder} />;
}
```

Add `PREP: '/staff/prep'` and `PREP: '/admin/prep'` to `ROUTES`; route pages must use a
full-height flex container with title `Pha chế` and `<PrepWorkspace enabled />`.

- [ ] **Step 4: Run focused browser/type checks**

Run: `pnpm --dir chalo-fe exec tsc --noEmit --pretty false` and the Playwright command from Step 2.

Expected: PASS; both roles can change Theo món/Theo bàn and tick a prepared unit with the existing mutation.

- [ ] **Step 5: Commit the shared workspace slice**

```bash
git add chalo-fe/src/app/'(staff)'/_components chalo-fe/src/app/'(staff)'/staff/prep chalo-fe/src/app/'(admin)'/admin/prep chalo-fe/src/constants/routes.ts chalo-fe/e2e/mobile-prep-workspace.spec.ts
git commit -m "feat: add shared mobile prep workspace"
```

- [ ] Task 2: Đưa Pha chế thành tab mobile một chạm

**Files:**
- Modify: `chalo-fe/src/app/(staff)/staff/_components/header.config.ts`
- Modify: `chalo-fe/src/app/(staff)/_components/MobileStaffNav.tsx`
- Modify: `chalo-fe/src/app/(admin)/_components/sidebar.config.ts`
- Modify: `chalo-fe/src/app/(admin)/_components/MobileAdminNav.tsx`
- Modify: `chalo-fe/src/app/(admin)/_components/admin-navigation.test.mts`
- Test: `chalo-fe/e2e/mobile-prep-workspace.spec.ts`

**Interfaces:**
- `STAFF_MOBILE_PRIMARY_NAV_ITEMS` includes `{ label: 'Pha chế', href: ROUTES.STAFF.PREP }`.
- `ADMIN_MOBILE_PRIMARY_NAV_ITEMS` includes `{ label: 'Pha chế', href: ROUTES.ADMIN.PREP }`.
- Mobile Staff renders primary five links and an overflow sheet containing Shift + logout.
- Mobile Admin primary route configuration contains `ROUTES.ADMIN.PREP` and moves Tables to overflow.

- [ ] **Step 1: Write failing navigation assertions**

```ts
assert.equal(getActiveAdminNavHref('/admin/prep', ADMIN_MOBILE_PRIMARY_NAV_ITEMS), '/admin/prep');
await page.setViewportSize({ width: 375, height: 667 });
await page.getByTestId('staff-mobile-nav').getByRole('link', { name: 'Pha chế' }).click();
await page.waitForURL('**/staff/prep');
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `pnpm --dir chalo-fe test:unit -- src/app/'(admin)'/_components/admin-navigation.test.mts`

Expected: FAIL because Pha chế is not a primary navigation route.

- [ ] **Step 3: Update route configurations and mobile nav**

```tsx
export const STAFF_MOBILE_PRIMARY_NAV_ITEMS = [
  { label: 'Đơn hàng', href: ROUTES.STAFF.ORDERS, icon: ClipboardListIcon },
  { label: 'POS', href: ROUTES.STAFF.POS, icon: MonitorIcon },
  { label: 'Pha chế', href: ROUTES.STAFF.PREP, icon: CoffeeIcon },
  { label: 'Bàn', href: ROUTES.STAFF.TABLES, icon: TableIcon },
] as const;
// Render four links plus Khác; sheet Khác contains Chốt ca and Đăng xuất.

const ADMIN_MOBILE_PRIMARY_HREFS = [
  ROUTES.ADMIN.DASHBOARD,
  ROUTES.ADMIN.MENU_CATEGORIES,
  ROUTES.ADMIN.ORDERS,
];
const ADMIN_MOBILE_PREP_NAV_ITEM = { label: 'Pha chế', href: ROUTES.ADMIN.PREP, icon: CoffeeIcon };
// ADMIN_MOBILE_PRIMARY_NAV_ITEMS appends PREP; Tables moves to overflow.
```

Use the existing `Modal` bottom-sheet pattern in `MobileAdminNav` for Staff Khác; ensure active
state resolves when pathname is `/staff/prep` or `/admin/prep`.

- [ ] **Step 4: Run browser navigation checks**

Run: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3015 pnpm --dir chalo-fe exec playwright test e2e/mobile-prep-workspace.spec.ts --project=chromium --reporter=line`

Expected: PASS at 375×667; Pha chế is a direct bottom-nav action for both roles, no card is hidden
under the nav, and Shift/Logout remain reachable through Khác.

- [ ] **Step 5: Commit the navigation slice**

```bash
git add chalo-fe/src/app/'(staff)'/staff/_components/header.config.ts chalo-fe/src/app/'(staff)'/_components/MobileStaffNav.tsx chalo-fe/src/app/'(admin)'/_components/sidebar.config.ts chalo-fe/src/app/'(admin)'/_components/MobileAdminNav.tsx chalo-fe/src/app/'(admin)'/_components/admin-navigation.test.mts chalo-fe/e2e/mobile-prep-workspace.spec.ts
git commit -m "feat: expose prep workspace in mobile navigation"
```

- [ ] Task 3: Kiểm chứng lifecycle và bàn giao

**Files:**
- Modify: `chalo-fe/e2e/mobile-prep-workspace.spec.ts`
- Modify: `docs/superpowers/plans/2026-08-16-mobile-prep-workspace.md`
- Create: `docs/superpowers/summaries/2026-08-16-mobile-prep-workspace-summary.md`

**Interfaces:**
- Produces browser evidence that `/staff/pos` and `/admin/dashboard` do not request `/api/order/active` solely because a hidden mobile prep workspace exists.
- Produces the linked four-section summary required by project conventions.

- [ ] **Step 1: Add the inactive-workspace request regression**

```ts
let activeOrderRequests = 0;
await page.route('**/api/order/active', (route) => { activeOrderRequests += 1; return route.fulfill(ok([])); });
await page.goto('/staff/pos');
await page.waitForTimeout(11_000);
expect(activeOrderRequests).toBe(0);
await page.goto('/staff/prep');
await expect.poll(() => activeOrderRequests).toBeGreaterThan(0);
```

- [ ] **Step 2: Run the regression before final behavior changes**

Run: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3015 pnpm --dir chalo-fe exec playwright test e2e/mobile-prep-workspace.spec.ts --project=chromium --reporter=line`

Expected: PASS after Task 1/2; a mobile route without workspace creates no active-order request.

- [ ] **Step 3: Run full quality suite**

Run: `pnpm --dir chalo-fe test:unit && pnpm --dir chalo-fe exec tsc --noEmit --pretty false && pnpm --dir chalo-fe build && git diff --check main...HEAD`

Expected: PASS; production standalone browser run checks Staff/Admin route, mobile nav, mode switch, tick action, empty state, console and failed response lists.

- [ ] **Step 4: Update plan and summary**

Tick each completed Task heading. Write the summary with `Đã làm gì`, `File chính`, `Khác với plan`, and `Còn dở / cần lưu ý`; begin it with links to this plan and the design spec.

- [ ] **Step 5: Commit verification and documentation**

```bash
git add chalo-fe/e2e/mobile-prep-workspace.spec.ts docs/superpowers/plans/2026-08-16-mobile-prep-workspace.md docs/superpowers/summaries/2026-08-16-mobile-prep-workspace-summary.md
git commit -m "test: verify mobile prep workspace"
```

## Kết quả

Sau khi hoàn thành: [summary](../summaries/2026-08-16-mobile-prep-workspace-summary.md).
