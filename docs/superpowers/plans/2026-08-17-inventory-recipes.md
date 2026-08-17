# Tồn kho nguyên liệu và công thức món — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Theo dõi nguyên liệu, tự chặn món thiếu kho, lưu sổ biến động không
thể sửa và đưa cảnh báo rõ ràng cho admin/staff.

**Architecture:** `InventoryModule` sở hữu Ingredient, ProductRecipe và
InventoryMovement. `OrderService` gọi `InventoryService.reserveForOrder`/
`releaseForCancelledOrder` trong transaction hiện có; frontend dùng API riêng
để quản trị, còn product status tiếp tục là contract sẵn có của POS/menu.

**Tech Stack:** NestJS, TypeORM/Postgres, Next.js App Router, TanStack Query,
Jest và Playwright.

**Spec:** `docs/superpowers/specs/2026-08-17-inventory-recipes-design.md`

## Global Constraints

- Không dùng floating point làm nguồn sự thật: DB `numeric(12,3)`, serializer
  chuyển về number chỉ ở biên API.
- Các movement không có API update/delete; mọi hiệu chỉnh tạo hàng mới.
- Kiểm kho, trừ kho và tạo order cùng transaction/row lock.
- Không thay đổi `UNAVAILABLE` do admin tắt tay khi tồn trở lại.
- Mọi UI mới phải kiểm Playwright desktop + 375×667 trước khi đánh dấu xong.

---

- [x] Task 1: Domain inventory, migration và API quản trị

**Files:**
- Create: `chalo-be/src/modules/inventory/{inventory.module.ts,inventory.service.ts,inventory.controller.ts}`
- Create: `chalo-be/src/modules/inventory/entities/{ingredient.entity.ts,product-recipe.entity.ts,inventory-movement.entity.ts}`
- Create: `chalo-be/src/modules/inventory/dto/*.ts`
- Create: migration sau `1784850000000`.
- Test: `chalo-be/src/modules/inventory/inventory.service.spec.ts`.

- [x] Viết test fail cho create ingredient, receipt/adjustment và public DTO.
- [x] Thêm enum movement, 3 entity, index product/ingredient duy nhất và migration.
- [x] Implement CRUD/adjust/list/history với guard Admin, validate unit/quantity/note.
- [x] Chạy `pnpm test -- inventory.service` và `pnpm build` trong `chalo-be`.
- [x] Commit `feat(be): thêm nguyên liệu và sổ biến động tồn kho`.

- [x] Task 2: Công thức, reservation và hoàn kho từ vòng đời đơn

**Files:**
- Modify: `chalo-be/src/modules/order/{order.module.ts,order.service.ts}`.
- Modify: `chalo-be/src/modules/product/{product.module.ts,product.service.ts}`.
- Create/Test: inventory reservation specs và order inventory specs.

- [x] Viết test fail cho thiếu một nguyên liệu, tổng nhu cầu hai line món, hủy
  đơn hoàn kho một lần và không đổi món `UNAVAILABLE`.
- [x] Implement recipe GET/PUT và `reserveForOrder(manager, items)` với lock
  `Ingredient` theo id tăng dần, SALE movement và cập nhật `onHand`.
- [x] Gọi reserve trước `Order` save trong `OrderService.create`; gọi release
  chỉ khi transition thực sự sang `CANCELLED`.
- [x] Đồng bộ `ProductStatus.OUT_OF_STOCK` sau receipt/adjust/reserve/release.
- [x] Chạy toàn bộ test backend + build, commit
  `feat(be): trừ và hoàn tồn kho theo công thức đơn hàng`.

- [x] Task 3: Client API, trang kho admin và công thức theo món

**Files:**
- Create: `chalo-fe/src/services/inventory/{inventory.api.ts,inventory.types.ts,inventory.queries.ts}`.
- Create: `chalo-fe/src/app/(admin)/admin/inventory/{page.tsx,_components/*}`.
- Modify: `chalo-fe/src/constants/{routes.ts,api-endpoints.ts}` và admin navigation.
- Modify: product form/page để chỉnh recipe.

- [x] Viết test component/logic fail cho parse số lượng 3 chữ số thập phân và
  phân loại `onHand <= reorderLevel`.
- [x] Thêm API/TanStack query, route/nav admin và bảng responsive có empty/error/loading.
- [x] Thêm dialog nhập kho/điều chỉnh bắt buộc ghi lý do, lịch sử movement read-only.
- [x] Thêm panel công thức trong product form, chỉ hiển thị nguyên liệu active.
- [x] Chạy FE unit/build, commit `feat(fe): quản trị kho và công thức món`.

- [x] Task 4: Cảnh báo vận hành và kiểm UI

**Files:**
- Modify: admin dashboard và POS staff alert surface.
- Create: `chalo-fe/e2e/inventory-management.spec.ts`.
- Modify: mock handlers cho inventory.

- [x] Hiển thị low-stock count/link cho admin, read-only alert gọn ở POS staff.
- [x] Viết Playwright fixture API, diễn lại create ingredient → receipt → adjust
  → history và low-stock; mở desktop + 375×667, assert no horizontal overflow.
- [x] Thu console errors và response >=400, phải rỗng ngoài request chủ ý.
- [x] Chạy `pnpm test:unit`, `pnpm build` và Playwright spec; commit
  `test(fe): kiểm tồn kho và cảnh báo vận hành`.

- [x] Task 5: Tài liệu, review và tổng kết

- [x] Cập nhật vận hành kho trong `deploy/README.md` nếu endpoint/migration có
  bước deploy đặc biệt.
- [x] Rà `git diff --check`, backend/FE full suites và status worktree.
- [x] Viết `docs/superpowers/summaries/2026-08-17-inventory-recipes-summary.md`
  theo diff thực tế, trỏ spec/plan; tick toàn bộ task hoàn tất.
- [x] Commit `docs: tổng kết tồn kho và công thức`.

## Kết quả

[Tổng kết thực thi](../summaries/2026-08-17-inventory-recipes-summary.md)
