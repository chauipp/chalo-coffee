# Application Smoothness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm POS và các màn nội bộ mượt ở menu lớn, đồng thời loại bỏ các request nền và truy vấn có thể suy giảm theo dữ liệu.

**Architecture:** POS chuyển product grid sang cửa sổ virtual theo viewport, tách render khỏi state giỏ hàng và truyền props ổn định đến card memoized. Query nền chỉ sống khi UI dùng được; backend thêm index/giới hạn ở boundary và gom phép tính ETA theo một response thay vì một lần trên mỗi đơn.

**Tech Stack:** Next.js 16, React 19, TanStack Query, `@tanstack/react-virtual`, NestJS, TypeORM/PostgreSQL, Node test/Jest, Playwright.

## Global Constraints

- Không thay đổi nghiệp vụ đặt món, modifier, pager, pha chế, thanh toán hoặc API response cho request hợp lệ hiện tại.
- POS phải giữ tìm kiếm, category, infinite page, keyboard/touch và accessibility của từng card.
- Virtual grid chỉ mount card trong/giáp viewport; overscan nhỏ để cuộn không lộ khoảng trống.
- UI đóng/ẩn hoàn toàn không được poll dữ liệu nền.
- Dữ liệu hiện có không bị đổi bởi migration; index migration phải có `down` an toàn.
- Page size vượt mức tối đa phải có hành vi xác định, được test và tài liệu API phản ánh.

---

## File structure

- `chalo-fe/src/app/(staff)/staff/pos/_components/VirtualProductGrid.tsx`: virtual grid POS và đo kích thước viewport/card.
- `chalo-fe/src/app/(staff)/staff/pos/_components/ProductCard.tsx`: card memoized, ảnh lazy/async.
- `chalo-fe/src/app/(staff)/staff/pos/page.tsx`, `_hooks/useCart.ts`: Map giỏ hàng, callbacks ổn định, reset grid khi filter đổi.
- `chalo-fe/src/app/(staff)/staff/pos/_components/PagerBoard.tsx`, `page.tsx`: chỉ mount pager query khi panel mở.
- `chalo-fe/src/app/(staff)/_components/PrepDock.tsx`, `layout.tsx`: dock desktop-only lifecycle.
- `chalo-fe/src/app/(admin)/admin/orders/page.tsx`: query/SSE chỉ chạy ở operations nhưng history filter không mất.
- `chalo-fe/src/services/order/order.queries.ts`: nhận option `enabled` cho active-order query.
- `chalo-be/src/migrations/*-PerformanceIndexes.ts`: index FK order items.
- `chalo-be/src/modules/order/*`: page limit and batch ETA implementation/tests.
- `chalo-fe/e2e/performance-pos.spec.ts`: fixture 300 sản phẩm, profile DOM/scroll and POS interactions.

## Task 1: Tối ưu product grid Staff POS

- [x] Task 1: Tối ưu product grid Staff POS

**Files:**
- Modify: `chalo-fe/package.json`, `chalo-fe/pnpm-lock.yaml`
- Create: `chalo-fe/src/app/(staff)/staff/pos/_components/VirtualProductGrid.tsx`
- Modify: `chalo-fe/src/app/(staff)/staff/pos/_components/ProductCard.tsx`
- Modify: `chalo-fe/src/app/(staff)/staff/pos/_hooks/useCart.ts`
- Modify: `chalo-fe/src/app/(staff)/staff/pos/page.tsx`
- Test: `chalo-fe/src/app/(staff)/staff/pos/_components/virtual-product-grid.test.mts`

**Interfaces:**
- Produces `VirtualProductGrid({ products, quantitiesByProductId, onSelectProduct, loadMoreRef, hasNextPage, isFetchingNextPage })`.
- Produces `useCart().quantitiesByProductId: ReadonlyMap<string, number>` and callback identities stable across cart changes.
- Consumes `ProductDto` and preserves `ProductCard` button name/disabled behavior.

- [ ] **Step 1: Write failing pure tests for visible range and cart quantities**

```ts
assert.deepEqual(getVirtualRange({ scrollTop: 2_400, viewportHeight: 600, rowHeight: 152, columns: 3, count: 300, overscanRows: 2 }), { start: 42, end: 59 });
assert.equal(buildQuantitiesByProductId([{ productId: 'p1', quantity: 3 }]).get('p1'), 3);
```

- [ ] **Step 2: Run the focused test to verify failure**

Run: `pnpm --dir chalo-fe test:unit -- src/app/'(staff)'/staff/pos/_components/virtual-product-grid.test.mts`

Expected: FAIL because range/cart helpers do not exist.

- [ ] **Step 3: Add the virtual grid and stable card boundary**

Install `@tanstack/react-virtual`, use its scroll element and `useVirtualizer({ count: products.length, estimateSize: () => ROW_HEIGHT, overscan: 3, lanes: columnCount })`. Memoize `ProductCard`, pass `quantity?: number` rather than a cart object, set image `loading="lazy"` and `decoding="async"`. Make `addToCart`, update/remove callbacks in `useCart` `useCallback`; build `quantitiesByProductId` with `useMemo`. Use one `onSelectProduct` callback in POS page and render the existing grid footer/load-more sentinel after virtual rows.

- [ ] **Step 4: Run frontend checks**

Run: `pnpm --dir chalo-fe test:unit && pnpm --dir chalo-fe exec tsc --noEmit --pretty false`

Expected: PASS; changing cart updates only changed card props and product grid retains all POS actions.

- [ ] **Step 5: Commit the POS slice**

```bash
git add chalo-fe/package.json chalo-fe/pnpm-lock.yaml chalo-fe/src/app/'(staff)'/staff/pos
git commit -m "perf: virtualize staff POS products"
```

## Task 2: Loại bỏ request nền ở UI không dùng

- [x] Task 2: Loại bỏ request nền ở UI không dùng

**Files:**
- Modify: `chalo-fe/src/app/(staff)/staff/pos/page.tsx`
- Modify: `chalo-fe/src/app/(staff)/_components/PrepDock.tsx`
- Modify: `chalo-fe/src/app/(staff)/layout.tsx`
- Modify: `chalo-fe/src/app/(admin)/admin/orders/page.tsx`
- Modify: `chalo-fe/src/services/order/order.queries.ts`
- Test: `chalo-fe/e2e/performance-background-requests.spec.ts`

**Interfaces:**
- `PagerBoard` mounts only while `showPagerBoard === true`.
- `PrepDock` gets `enabled: boolean`; it must not subscribe/refetch when false.
- `AdminOrdersOperations` gets `enabled: boolean`; `useGetActiveOrder` accepts `{ enabled?: boolean, refetchInterval?: number }`; switching mode preserves `AdminOrdersHistory` state.

- [ ] **Step 1: Add browser request-count regressions**

```ts
await page.goto('/staff/pos');
await page.waitForTimeout(16_000);
expect(pagerRequests).toBe(0);

await page.getByRole('button', { name: /Thẻ bàn/ }).click();
await expect.poll(() => pagerRequests).toBeGreaterThan(0);
```

- [ ] **Step 2: Run the new test to verify failure**

Run: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3015 pnpm --dir chalo-fe exec playwright test e2e/performance-background-requests.spec.ts --project=chromium --reporter=line`

Expected: FAIL because closed pager still polls and hidden sections still mount active queries.

- [ ] **Step 3: Gate component/query lifetime without changing visible behavior**

Render `PagerBoard` conditionally; render `PrepDock` only on desktop via a hydration-safe media hook and pass its enabled flag to `useGetActiveOrder`. Keep history mounted in admin but make operations query/SSE enabled only in operations mode, then re-enable on return. Do not remove saved history/filter state.

- [ ] **Step 4: Run targeted browser and TypeScript checks**

Run: `pnpm --dir chalo-fe exec tsc --noEmit --pretty false` and the browser command from Step 2.

Expected: PASS; no hidden polling, visible panels load normally, history filters remain after tab switches.

- [ ] **Step 5: Commit the lifecycle slice**

```bash
git add chalo-fe/src/app/'(staff)' chalo-fe/src/app/'(admin)'/admin/orders chalo-fe/e2e/performance-background-requests.spec.ts
git commit -m "perf: pause unused staff and admin queries"
```

## Task 3: Bảo vệ truy vấn đơn hàng khi dữ liệu tăng

- [x] Task 3: Bảo vệ truy vấn đơn hàng khi dữ liệu tăng

**Files:**
- Create: `chalo-be/src/migrations/1784365811596-PerformanceIndexes.ts`
- Modify: `chalo-be/src/modules/order/order.controller.ts`
- Modify: `chalo-be/src/modules/order/order.service.ts`
- Create: `chalo-be/src/modules/order/order.service.by-token.spec.ts`
- Modify: `chalo-be/api.docs.md`

**Interfaces:**
- Produces indexes `IDX_order_items_order_id` on `"orderId"` and `IDX_order_items_product_id` on `"productId"`.
- Defines `MAX_PAGE_SIZE = 100`; page endpoints clamp requests above 100 and default to their existing sizes.
- `getByTableToken` calculates queue/ETA data once per response, then maps order DTOs without per-order queue queries.

- [ ] **Step 1: Write failing tests for limits and one-pass ETA**

```ts
expect(normalizePageSize(1_000)).toBe(100);
await service.getByTableToken('table-token');
expect(queueQuery).toHaveBeenCalledTimes(1);
```

- [ ] **Step 2: Run focused backend tests to verify failure**

Run: `pnpm --dir chalo-be test --runInBand order.service`

Expected: FAIL because page clamp/helper and batch ETA path do not exist.

- [ ] **Step 3: Add rollback-safe indexes and bounded query code**

Migration `up` creates the two indexes with quoted columns; `down` drops exactly those indexes. Validate/clamp page size in controller/service shared helper and document `max 100`. Refactor only the `estimatedWaitMinutes == null` path to reuse a single loaded queue snapshot; preserve current per-order ETA math and order sort.

- [ ] **Step 4: Run backend validation**

Run: `pnpm --dir chalo-be test --runInBand && pnpm --dir chalo-be run build`

Expected: PASS; migration compiles, normal page callers are unchanged, historical orders receive the same ETA values without N+1 queue reads.

- [ ] **Step 5: Commit the backend slice**

```bash
git add chalo-be/src/migrations/1784365811596-PerformanceIndexes.ts chalo-be/src/modules/order chalo-be/api.docs.md
git commit -m "perf: bound and index order queries"
```

## Task 4: Đo lại production UI và bàn giao

- [x] Task 4: Đo lại production UI và bàn giao

**Files:**
- Create: `chalo-fe/e2e/performance-pos.spec.ts`
- Modify: `docs/superpowers/plans/2026-08-16-application-smoothness.md`
- Create: `docs/superpowers/summaries/2026-08-16-application-smoothness-summary.md`

**Interfaces:**
- Consumes fixture 300 products and POS virtual grid.
- Produces test evidence: rendered product-card count substantially below 300, no console/HTTP >=400, pager request stays zero while closed.

- [ ] **Step 1: Add a production browser measurement**

```ts
await page.goto('/staff/pos');
await expect.poll(() => page.getByTestId('pos-product-card').count()).toBeLessThan(100);
await page.locator('[data-testid="pos-product-scroll"]').evaluate((el) => { el.scrollTop = el.scrollHeight; });
await expect(page.getByText('Món hiệu năng 299')).toBeVisible();
```

- [ ] **Step 2: Build and run desktop/mobile browser verification**

Run: `pnpm --dir chalo-fe build`; copy `.next/static` into standalone bundle; start `PORT=3015 HOSTNAME=127.0.0.1 node server.js` inside `chalo-fe/.next/standalone`; then run `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3015 pnpm --dir chalo-fe exec playwright test e2e/performance-pos.spec.ts --project=chromium --reporter=line`.

Expected: PASS; scroll reaches the last product, add-to-cart works, console/network are clean, and mobile layout remains usable.

- [ ] **Step 3: Run full quality suite and update docs**

Run: `pnpm --dir chalo-fe test:unit && pnpm --dir chalo-fe exec tsc --noEmit --pretty false && pnpm --dir chalo-be test --runInBand && pnpm --dir chalo-be run build && git diff --check main...HEAD`.

Expected: all PASS. Tick each completed task, write the linked summary with Đã làm gì/File chính/Khác với plan/Còn dở, and state that phase 2 remains deferred until production volume metrics require it.

- [ ] **Step 4: Commit evidence and documentation**

```bash
git add chalo-fe/e2e/performance-pos.spec.ts docs/superpowers/plans/2026-08-16-application-smoothness.md docs/superpowers/summaries/2026-08-16-application-smoothness-summary.md
git commit -m "test: verify application smoothness"
```

## Kết quả

Sau khi hoàn thành: [summary](../summaries/2026-08-16-application-smoothness-summary.md).
