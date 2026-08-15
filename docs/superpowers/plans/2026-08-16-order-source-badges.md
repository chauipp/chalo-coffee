# Order Source Badges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lưu và hiển thị chính xác nguồn đơn QR, POS hoặc N/A trong mọi luồng nội bộ.

**Architecture:** Backend là nguồn chân lý: `OrderSource` được suy ra từ vai trò của request đã xác thực, sau đó được lưu trên `orders` và đưa vào mọi `OrderDto`. Frontend chỉ gửi request theo luồng hiện hữu, nhận `orderSource` từ DTO, rồi dùng một component badge dùng chung ở bảng vận hành và khu pha chế.

**Tech Stack:** NestJS + TypeORM/PostgreSQL, Next.js/React/TypeScript, Jest, MSW, Playwright.

## Global Constraints

- Dữ liệu lịch sử phải có `orderSource = N_A`; không suy đoán nguồn.
- Endpoint tạo đơn không được tin `orderSource` từ request payload.
- `ADMIN` và `MODERATOR` tạo tại POS là `POS`; khách hoặc request không xác thực là `QR`.
- Không thay đổi logic pager, pha chế, hay thanh toán.
- Giao diện desktop và mobile giữ nguyên bố cục hiện có; badge chỉ bổ sung ngữ cảnh.

---

## File structure

- `chalo-be/src/common/enums/order-source.enum.ts`: enum nguồn đơn duy nhất của backend.
- `chalo-be/src/migrations/1784365811595-OrderSource.ts`: thêm enum/cột, backfill N_A và rollback.
- `chalo-be/src/modules/order/entities/order.entity.ts`: ánh xạ cột `orderSource`.
- `chalo-be/src/modules/order/dto/create-order.dto.ts`: không khai báo trường nguồn, giữ payload công khai an toàn.
- `chalo-be/src/modules/order/order.service.ts`: suy ra nguồn từ user và trả về DTO.
- `chalo-be/src/modules/order/order.service.customer.spec.ts`: chứng minh QR/POS/N_A được suy ra đúng.
- `chalo-fe/src/services/order/order.types.ts`: type `OrderSource`, `OrderDto.orderSource`.
- `chalo-fe/src/mocks/handlers/order.handlers.ts`: fixture và create mock có nguồn tương thích.
- `chalo-fe/src/components/orders/OrderSourceBadge.tsx`: ánh xạ duy nhất từ source sang copy/màu badge.
- `chalo-fe/src/components/orders/operations/OrderCard.tsx`: hiển thị badge ở admin/staff orders.
- `chalo-fe/src/utils/prep-grouping.ts`, `PrepTableCard.tsx`, `PrepProductCard.tsx`: mang và hiện badge trên thông tin từng đơn/ly ở khu pha chế.
- `chalo-fe/e2e/order-source-badges.spec.ts`: browser test badge trên board và prep dock bằng fixture MSW.

## Task 1: Lưu nguồn đơn an toàn ở backend

- [x] Task 1: Lưu nguồn đơn an toàn ở backend

**Files:**
- Create: `chalo-be/src/common/enums/order-source.enum.ts`
- Create: `chalo-be/src/migrations/1784365811595-OrderSource.ts`
- Modify: `chalo-be/src/modules/order/entities/order.entity.ts`
- Modify: `chalo-be/src/modules/order/order.service.ts`
- Modify: `chalo-be/src/modules/order/order.service.customer.spec.ts`

**Interfaces:**
- Produces: `enum OrderSource { QR = 'QR', POS = 'POS', N_A = 'N_A' }`.
- Produces: `Order.orderSource: OrderSource` and API DTO property `orderSource: OrderSource`.
- Consumes: `OptionalOrderCustomer.role: UserRole`; `ADMIN | MODERATOR` maps to `POS`, every other request maps to `QR`.

- [ ] **Step 1: Add focused failing source tests**

```ts
import { OrderSource } from '../../common/enums/order-source.enum';

it('lưu QR cho request public', async () => {
  await service.create(dto, null);
  expect(savedOrder?.orderSource).toBe(OrderSource.QR);
});

it('lưu POS cho vai trò nội bộ', async () => {
  await service.create(dto, { ...customer, role: UserRole.MODERATOR });
  expect(savedOrder?.orderSource).toBe(OrderSource.POS);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `pnpm --dir chalo-be test -- order.service.customer.spec.ts`

Expected: TypeScript/test failure because `OrderSource` and `savedOrder.orderSource` do not exist.

- [ ] **Step 3: Add enum, migration, entity mapping, and server-side derivation**

```ts
// order-source.enum.ts
export enum OrderSource { QR = 'QR', POS = 'POS', N_A = 'N_A' }

// order.service.ts, inside create() before manager.create(Order, ...)
const orderSource = authenticatedUser?.role === UserRole.ADMIN || authenticatedUser?.role === UserRole.MODERATOR
  ? OrderSource.POS
  : OrderSource.QR;

const order = manager.create(Order, { /* existing fields */, orderSource });
```

Migration must create PostgreSQL enum `orders_order_source_enum`, add non-null `orderSource` with default `'N_A'`, update existing rows to `'N_A'`, and drop the enum/column in `down`. Add `orderSource` to `buildDto`; do not add it to `CreateOrderDto`.

- [ ] **Step 4: Run backend unit and type checks**

Run: `pnpm --dir chalo-be test -- order.service.customer.spec.ts && pnpm --dir chalo-be run build`

Expected: PASS; public/customer paths are QR, admin/moderator paths are POS, and no payload field can override either value.

- [ ] **Step 5: Commit the backend slice**

```bash
git add chalo-be/src/common/enums/order-source.enum.ts chalo-be/src/migrations/1784365811595-OrderSource.ts chalo-be/src/modules/order/entities/order.entity.ts chalo-be/src/modules/order/order.service.ts chalo-be/src/modules/order/order.service.customer.spec.ts
git commit -m "feat: track trusted order sources"
```

## Task 2: Carry the source through frontend data and render reusable badges

- [x] Task 2: Carry the source through frontend data and render reusable badges

**Files:**
- Create: `chalo-fe/src/components/orders/OrderSourceBadge.tsx`
- Modify: `chalo-fe/src/services/order/order.types.ts`
- Modify: `chalo-fe/src/mocks/handlers/order.handlers.ts`
- Modify: `chalo-fe/src/components/orders/operations/OrderCard.tsx`
- Modify: `chalo-fe/src/utils/prep-grouping.ts`
- Modify: `chalo-fe/src/app/(staff)/_components/PrepTableCard.tsx`
- Modify: `chalo-fe/src/app/(staff)/_components/PrepProductCard.tsx`
- Test: `chalo-fe/src/components/orders/OrderSourceBadge.test.tsx`
- Test: `chalo-fe/e2e/prep-grouping.unit.spec.ts`

**Interfaces:**
- Consumes: backend DTO `orderSource: 'QR' | 'POS' | 'N_A'`.
- Produces: `OrderSourceBadge({ source }: { source: OrderSource })` with visible copy `QR`, `Quầy`, or `N/A`.
- Produces: `PrepUnit.orderSource` and `TableProgress.orderSource` to avoid losing the distinction during prep grouping.

- [ ] **Step 1: Write failing mapping and grouping tests**

```tsx
expect(render(<OrderSourceBadge source="QR" />).getByText('QR')).toBeInTheDocument();
expect(render(<OrderSourceBadge source="POS" />).getByText('Quầy')).toBeInTheDocument();
expect(render(<OrderSourceBadge source="N_A" />).getByText('N/A')).toBeInTheDocument();
```

```ts
expect(tableProgress([makeOrder({ orderSource: 'POS' })])[0].orderSource).toBe('POS');
```

- [ ] **Step 2: Run focused frontend tests to verify they fail**

Run: `pnpm --dir chalo-fe exec vitest run src/components/orders/OrderSourceBadge.test.tsx e2e/prep-grouping.unit.spec.ts`

Expected: FAIL because the type, badge component, and grouping fields do not exist.

- [ ] **Step 3: Implement types, mocks, badge, and placements**

```ts
export const ORDER_SOURCE = ['QR', 'POS', 'N_A'] as const;
export type OrderSource = (typeof ORDER_SOURCE)[number];

export interface OrderDto { /* existing fields */ orderSource: OrderSource; }
```

`OrderSourceBadge` centralizes Vietnamese label and accessible `aria-label` (`Nguồn đơn: QR`, `Nguồn đơn: Quầy`, `Nguồn đơn: N/A`). Place it beside table/order metadata in `OrderCard`; render it in table-mode prep cards and include a short source marker in product-mode unit buttons. Render `Thẻ #${pagerNumber}` only when the order source is `POS` and a pager exists. Update all mock orders and test factories with `orderSource: 'N_A'` unless a test explicitly needs QR/POS.

- [ ] **Step 4: Run frontend unit and type checks**

Run: `pnpm --dir chalo-fe test:unit && pnpm --dir chalo-fe exec tsc --noEmit --pretty false`

Expected: PASS; all existing order fixtures type-check and every source has exactly one readable badge label.

- [ ] **Step 5: Commit the frontend data/UI slice**

```bash
git add chalo-fe/src/services/order/order.types.ts chalo-fe/src/mocks/handlers/order.handlers.ts chalo-fe/src/components/orders/OrderSourceBadge.tsx chalo-fe/src/components/orders/OrderSourceBadge.test.tsx chalo-fe/src/components/orders/operations/OrderCard.tsx chalo-fe/src/utils/prep-grouping.ts chalo-fe/src/app/'(staff)'/_components/PrepTableCard.tsx chalo-fe/src/app/'(staff)'/_components/PrepProductCard.tsx chalo-fe/e2e/prep-grouping.unit.spec.ts
git commit -m "feat: show order source badges"
```

## Task 3: Verify end-to-end data and visual behavior

- [x] Task 3: Verify end-to-end data and visual behavior

**Files:**
- Create: `chalo-fe/e2e/order-source-badges.spec.ts`
- Modify: `docs/superpowers/plans/2026-08-16-order-source-badges.md`
- Create: `docs/superpowers/summaries/2026-08-16-order-source-badges-summary.md`

**Interfaces:**
- Consumes: `OrderSourceBadge` and MSW fixtures with QR, POS/pager, and N_A orders.
- Produces: regression coverage that asserts badge meaning in desktop admin board and full-height prep dock.

- [ ] **Step 1: Add a browser fixture test**

```ts
await page.goto('/admin/orders');
await expect(page.getByLabel('Nguồn đơn: QR')).toBeVisible();
await expect(page.getByLabel('Nguồn đơn: Quầy')).toBeVisible();
await expect(page.getByText('Thẻ #12')).toBeVisible();
await expect(page.getByLabel('Nguồn đơn: N/A')).toBeVisible();
```

- [ ] **Step 2: Build and run the targeted browser test**

Run: `pnpm --dir chalo-fe build && PLAYWRIGHT_BASE_URL=http://localhost:3014 pnpm --dir chalo-fe exec playwright test e2e/order-source-badges.spec.ts --project=chromium --reporter=line`

Expected: PASS after starting the production app with `pnpm --dir chalo-fe start -p 3014`; badge labels remain visible without console errors or failed API responses.

- [ ] **Step 3: Run repository quality checks**

Run: `pnpm --dir chalo-fe test:unit && pnpm --dir chalo-fe exec tsc --noEmit --pretty false && pnpm --dir chalo-be run build && git diff --check main...HEAD`

Expected: all commands PASS.

- [ ] **Step 4: Update plan, write summary, and commit docs/tests**

Tick all completed task headings, write the linked summary with the required four sections, then run:

```bash
git add chalo-fe/e2e/order-source-badges.spec.ts docs/superpowers/plans/2026-08-16-order-source-badges.md docs/superpowers/summaries/2026-08-16-order-source-badges-summary.md docs/superpowers/specs/2026-08-16-order-source-badges-design.md
git commit -m "test: verify order source badges"
```

## Kết quả

Sau khi hoàn thành: [summary](../summaries/2026-08-16-order-source-badges-summary.md).
