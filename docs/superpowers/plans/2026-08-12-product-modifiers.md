# Dynamic Product Modifiers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins configure per-product modifiers and ensure every ordering channel prices, stores, and displays the selected options accurately.

**Architecture:** Product-owned modifier group and option tables are loaded with ordering products. Order creation accepts only option IDs, validates them against the product configuration, then snapshots labels and price adjustments into the order item. A shared frontend modifier selection model feeds customer cart and staff POS, whose cart identity includes a canonical modifier key.

**Tech Stack:** NestJS, TypeORM/PostgreSQL JSONB, class-validator, Next.js/React, React Hook Form/Zod, Zustand, Tailwind, Node tests, Playwright.

## Global Constraints

- Per-product configuration only; do not add shared modifier libraries or inventory handling.
- New modifier option price adjustments default to `0` and must be non-negative integers.
- Server is the sole authority for modifier validity and final item price.
- Preserve existing order and cart behavior for products with no modifier groups.
- Use a dedicated worktree and commit each completed task checkpoint.
- Verify every changed browser flow with Playwright at 375×667 before reporting completion.

---

## File structure

- `chalo-be/src/modules/product/entities/product-modifier-*.entity.ts`: persistent per-product configuration.
- `chalo-be/src/modules/product/dto/product-modifier.dto.ts`: validated nested product payload types.
- `chalo-be/src/migrations/1784365811594-ProductModifiers.ts`: schema and historical order compatibility.
- `chalo-be/src/modules/product/product.service.ts`: load and atomically replace product modifier configuration.
- `chalo-be/src/modules/order/order.service.ts`: validate IDs, calculate price, snapshot selected labels.
- `chalo-be/src/modules/order/entities/order-item.entity.ts`: selected modifier JSONB snapshot.
- `chalo-fe/src/services/menu/menu.types.ts`, `chalo-fe/src/services/order/order.types.ts`: matching API models.
- `chalo-fe/src/components/menu/ProductModifierFields.tsx`: reusable admin form editor.
- `chalo-fe/src/components/menu/ProductModifierPicker.tsx`: reusable order-time picker and validation.
- `chalo-fe/src/utils/cart-modifiers.ts`: canonical selection key and calculated display helpers.
- Customer and POS components: invoke picker, send option IDs, and display selected snapshots.

## Tasks

- [ ] Task 1: Persist product modifier configuration and order snapshots

**Files:**
- Create: `chalo-be/src/modules/product/entities/product-modifier-group.entity.ts`
- Create: `chalo-be/src/modules/product/entities/product-modifier-option.entity.ts`
- Create: `chalo-be/src/modules/product/dto/product-modifier.dto.ts`
- Create: `chalo-be/src/migrations/1784365811594-ProductModifiers.ts`
- Modify: `chalo-be/src/modules/product/entities/product.entity.ts`
- Modify: `chalo-be/src/modules/order/entities/order-item.entity.ts`
- Modify: `chalo-be/src/modules/product/dto/create-product.dto.ts`
- Modify: `chalo-be/src/modules/product/dto/update-product.dto.ts`
- Modify: `chalo-be/src/modules/product/product.module.ts`
- Test: `chalo-be/src/modules/product/product-modifiers.dto.spec.ts`

**Interfaces:**
- Produces `ProductModifierGroup` / `ProductModifierOption` and `CreateProductDto.modifierGroups`.
- Produces `OrderItem.selectedModifiers: SelectedModifierSnapshot[]` with default `[]` for historical rows.

- [ ] Step 1: Write DTO tests for valid groups, default 0 price, and invalid empty/name/negative inputs.
- [ ] Step 2: Run the focused test and confirm it fails before DTO/entity implementation.
- [ ] Step 3: Add entities, associations, validated nested DTOs, order JSONB column, and reversible-safe migration.
- [ ] Step 4: Run backend typecheck and focused test.
- [ ] Step 5: Commit `feat: add product modifier persistence`.

- [ ] Task 2: Make product CRUD and order pricing modifier-aware

**Files:**
- Modify: `chalo-be/src/modules/product/product.service.ts`
- Modify: `chalo-be/src/modules/order/dto/create-order.dto.ts`
- Modify: `chalo-be/src/modules/order/order.service.ts`
- Test: `chalo-be/src/modules/order/order.service.modifiers.spec.ts`
- Test: `chalo-be/src/modules/product/product.service.modifiers.spec.ts`

**Interfaces:**
- Consumes Task 1 configuration and snapshots.
- Produces product DTO `modifierGroups`; accepts `CreateOrderItemDto.modifierOptionIds?: string[]`; returns item `selectedModifiers`.

- [ ] Step 1: Write service tests covering required single choice, multiple choice, foreign/duplicate option IDs, server-side price calculation, and immutable snapshot.
- [ ] Step 2: Run focused tests and confirm failing expectations.
- [ ] Step 3: Load ordered modifier relations on public/admin product queries, atomically replace groups during create/update, and validate/order snapshots inside the order transaction.
- [ ] Step 4: Run backend tests and TypeScript build.
- [ ] Step 5: Commit `feat: price orders from selected modifiers`.

- [ ] Task 3: Add dynamic modifier editor to the admin product form

**Files:**
- Create: `chalo-fe/src/components/menu/ProductModifierFields.tsx`
- Modify: `chalo-fe/src/schemas/menu.schema.ts`
- Modify: `chalo-fe/src/services/menu/menu.types.ts`
- Modify: `chalo-fe/src/app/(admin)/admin/menu/products/_components/ProductForm.tsx`
- Test: `chalo-fe/src/schemas/menu.schema.test.mts`
- Test: `chalo-fe/e2e/admin-product-modifiers.spec.ts`

**Interfaces:**
- Consumes/produces `ProductModifierGroupInput[]` in `ProductFormType`.
- Defaults each newly inserted option `priceAdjustment` to `0`.

- [ ] Step 1: Write Zod tests for valid group structures and invalid missing/negative fields.
- [ ] Step 2: Implement form types/schema and field-array editor with accessible add/remove controls.
- [ ] Step 3: Run frontend node tests/typecheck/build.
- [ ] Step 4: Run Playwright admin form flow at mobile width: add group, add option, observe `0đ`, edit price, and validate required fields.
- [ ] Step 5: Commit `feat: let admins configure product modifiers`.

- [ ] Task 4: Add modifier-aware cart and customer ordering UX

**Files:**
- Create: `chalo-fe/src/components/menu/ProductModifierPicker.tsx`
- Create: `chalo-fe/src/utils/cart-modifiers.ts`
- Modify: `chalo-fe/src/services/order/order.types.ts`
- Modify: `chalo-fe/src/stores/cart.store.ts`
- Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/ProductCard.tsx`
- Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/CustomerMenuClient.tsx`
- Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/cart/page.tsx`
- Test: `chalo-fe/src/utils/cart-modifiers.test.mts`
- Test: `chalo-fe/e2e/customer-product-modifiers.spec.ts`

**Interfaces:**
- Consumes product `modifierGroups`, produces cart item `modifierOptionIds` and display snapshots.
- Sends modifier option IDs in `CreateOrderPayload.items`.

- [ ] Step 1: Write pure cart identity/price tests for sorted option IDs and distinct combinations.
- [ ] Step 2: Implement picker validation and canonical cart keys; migrate old persisted cart data safely.
- [ ] Step 3: Add picker to customer detail modal, dynamic price/summary, cart option display, and order payload mapping.
- [ ] Step 4: Run frontend tests/typecheck/build.
- [ ] Step 5: Run Playwright customer flow at 375×667: blocked required selection, price update, two distinct combinations, cart/checkout option display.
- [ ] Step 6: Commit `feat: support modifiers in customer orders`.

- [ ] Task 5: Add modifier-aware staff POS and operational display

**Files:**
- Modify: `chalo-fe/src/app/(staff)/staff/pos/page.tsx`
- Modify: `chalo-fe/src/app/(staff)/staff/pos/_components/ProductCard.tsx`
- Modify: `chalo-fe/src/app/(staff)/staff/pos/_components/CartItem.tsx`
- Modify: `chalo-fe/src/components/shared/Receipt.tsx`
- Modify: `chalo-fe/src/app/(staff)/_components/PrepProductCard.tsx`
- Test: `chalo-fe/e2e/staff-product-modifiers.spec.ts`

**Interfaces:**
- Consumes shared picker/cart modifier interfaces from Task 4.
- Sends selected IDs through POS create-order mapping and renders order snapshots under item names.

- [ ] Step 1: Adapt POS state/actions to use modifier-aware cart identity rather than only product ID.
- [ ] Step 2: Open the shared picker from products that have modifier groups and show selected choices under POS cart, receipt, and prep item names.
- [ ] Step 3: Run frontend tests/typecheck/build.
- [ ] Step 4: Run Playwright staff POS flow at desktop and 375×667: select options, see updated price, alter two variants independently, submit, and inspect prep display.
- [ ] Step 5: Commit `feat: support modifiers in staff POS and prep`.

- [ ] Task 6: Full regression, documentation, and integration checkpoint

**Files:**
- Modify: `docs/superpowers/specs/2026-08-12-product-modifiers-design.md`
- Modify: `docs/superpowers/plans/2026-08-12-product-modifiers.md`
- Create: `docs/superpowers/summaries/2026-08-12-product-modifiers-summary.md`

- [ ] Step 1: Run all backend/frontend tests, typechecks, production builds, and targeted Playwright suites.
- [ ] Step 2: Inspect console/network on customer, admin, and staff modifier paths; document any environment-only limitation precisely.
- [ ] Step 3: Tick every completed task, write the summary based on the actual diff/commits, and link all three documents.
- [ ] Step 4: Commit `docs: summarize product modifier delivery`.

## Kết quả

Kết quả sẽ được ghi tại `../summaries/2026-08-12-product-modifiers-summary.md`.
