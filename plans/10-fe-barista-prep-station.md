# Barista Prep Station (Split-Screen + Batching) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Biến màn `/staff/orders` thành giao diện chia đôi kéo-thả được: trái là 3 cột đơn (Chờ xác nhận / Đã xác nhận / Sẵn sàng), phải là Khu pha chế (PREPARING) có ticklist từng món, gộp đơn thủ công và gợi ý gộp đơn thông minh (bật/tắt trong Admin Settings).

**Architecture:** Toggle `smartBatchingEnabled` lưu ở BE `app_settings` (single-row) — GET public nên staff đọc được. Toàn bộ state pha chế phía client (tick từng món, nhóm gộp, gợi ý đã bỏ qua) nằm trong một zustand store persist localStorage (`prep.store.ts`) vì BE không có khái niệm per-item status. Thuật toán gợi ý là pure function trong `utils/batching.ts` (test được độc lập). UI: `SplitPane` (pointer-drag + keyboard), cột trái tái dùng `KanbanColumn`/`OrderCard` (thêm chế độ chọn), khu phải là `PrepStation`/`PrepTicket`.

**Tech Stack:** Next 16 App Router (client components), TanStack Query, zustand + persist, Tailwind v4, NestJS + TypeORM (migration), Jest (BE), Playwright (FE).

## Global Constraints

- Worktree: `.claude/worktrees/barista-split-screen`, nhánh `worktree-barista-split-screen` (từ main). KHÔNG đụng vào checkout chính.
- DB Postgres cổng **5433** dùng chung với agent khác — migration phải additive (`ADD COLUMN IF NOT EXISTS`, có default). KHÔNG sửa `DB_PORT`, không sửa `.env`/`.env.local` (đang được git track).
- Port dev của worktree này: **BE 8082, FE 3020** (3000/8080/8081 đã bị agent khác chiếm). Truyền qua env inline khi chạy lệnh, không sửa file env.
- Giữ nguyên các hành vi mà e2e hiện có phụ thuộc: text `#<6-ký-tự-cuối-id>` trên card mở modal chi tiết (staff-receipt.spec.ts), label cột giữ nguyên tiếng Việt hiện tại, toggle admin đầu tiên vẫn là wait-time (admin-settings.spec.ts sẽ được sửa `.first()` vì thêm toggle thứ 2).
- Copy/labels tiếng Việt, comment code theo phong cách bilingual sẵn có của repo.
- Sau khi xong (và pass review nếu có) task nào → tick checkbox `- [x]` của TASK đó trong file này NGAY, không dồn cuối phiên.

---

- [x] Task 1: BE — setting `smartBatchingEnabled`
- [x] Task 2: FE — settings service + Admin toggle + sửa e2e admin-settings
- [x] Task 3: FE logic core — orders.config, utils/batching (+unit test), prep.store
- [x] Task 4: FE UI — SplitPane + PrepStation/PrepTicket + rewrite page
- [ ] Task 5: FE — Manual batching (chọn nhiều đơn → pha chung)
- [ ] Task 6: FE — Smart batching suggestion + gate theo settings
- [ ] Task 7: Chạy migration + servers (BE 8082 / FE 3020), verify end-to-end, chốt

---

### Task 1: BE — setting `smartBatchingEnabled`

**Files:**
- Modify: `chalo-be/src/modules/settings/entities/app-settings.entity.ts`
- Modify: `chalo-be/src/modules/settings/dto/update-settings.dto.ts`
- Modify: `chalo-be/src/modules/settings/settings.service.ts`
- Create: `chalo-be/src/migrations/1752900000000-AddSmartBatchingSetting.ts`
- Test: `chalo-be/src/modules/settings/settings.service.spec.ts`

**Interfaces:**
- Produces: `AppSettings.smartBatchingEnabled: boolean` (default `true`), nhận qua `PUT /settings { smartBatchingEnabled?: boolean }`, trả về trong `GET /settings` (public).

- [x] **Step 1: Viết test fail** — thêm vào `settings.service.spec.ts`: thêm `smartBatchingEnabled: true` vào `defaultRow`, và test mới:

```ts
  it('update() can flip smartBatchingEnabled alone', async () => {
    repo.findOneBy.mockResolvedValue({ ...defaultRow });
    const result = await service.update({ smartBatchingEnabled: false });
    expect(result.smartBatchingEnabled).toBe(false);
    expect(result.waitTimeEnabled).toBe(true); // untouched
    expect(result.baristaCount).toBe(3); // untouched
  });
```

- [x] **Step 2: Chạy test, xác nhận fail** — `cd chalo-be && pnpm jest settings.service` → FAIL (property không tồn tại / TS error).

- [x] **Step 3: Implement** — entity thêm cột (sau `bankAccountName`):

```ts
  /** Bật/tắt gợi ý gộp đơn thông minh ở màn pha chế của staff */
  @Column({ type: 'boolean', default: true })
  smartBatchingEnabled: boolean;
```

DTO thêm field:

```ts
  @ApiPropertyOptional({ example: true, description: 'Bật/tắt gợi ý gộp đơn thông minh (staff prep)' })
  @IsOptional()
  @IsBoolean()
  smartBatchingEnabled?: boolean;
```

Service `update()` thêm dòng:

```ts
    if (dto.smartBatchingEnabled !== undefined)
      settings.smartBatchingEnabled = dto.smartBatchingEnabled;
```

Migration `1752900000000-AddSmartBatchingSetting.ts`:

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';

/** Gợi ý gộp đơn thông minh: admin bật/tắt, staff prep đọc (GET /settings public). */
export class AddSmartBatchingSetting1752900000000 implements MigrationInterface {
  name = 'AddSmartBatchingSetting1752900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "smartBatchingEnabled" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_settings" DROP COLUMN IF EXISTS "smartBatchingEnabled"`);
  }
}
```

- [x] **Step 4: Test pass** — `pnpm jest settings.service` → 5 test PASS. Chạy thêm `pnpm run lint` nếu nhanh.

- [x] **Step 5: Commit** — `git add chalo-be && git commit -m "feat(be): smartBatchingEnabled setting + migration"`

---

### Task 2: FE — settings service + Admin toggle + sửa e2e admin-settings

**Files:**
- Modify: `chalo-fe/src/services/settings/settings.types.ts`
- Modify: `chalo-fe/src/app/(admin)/admin/settings/page.tsx`
- Modify: `chalo-fe/e2e/admin-settings.spec.ts` (locator `div.h-6.w-11` giờ match 2 toggle → `.first()`)

**Interfaces:**
- Consumes: BE field từ Task 1.
- Produces: `SettingsDto.smartBatchingEnabled: boolean`; staff page (Task 6) đọc qua `useGetSettings()`.

- [x] **Step 1:** `settings.types.ts` — thêm `smartBatchingEnabled: boolean;` vào `SettingsDto` và `smartBatchingEnabled: boolean;` vào `UpdateSettingsPayload`.

- [x] **Step 2:** Admin page — thêm biến `const smartBatchingEnabled = current?.smartBatchingEnabled ?? true;`, đưa field vào `patch()` object, vào điều kiện `dirty`, vào payload `save()`; thêm block toggle mới (card riêng, đặt SAU card wait-time để toggle wait-time vẫn là `.first()`):

```tsx
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Gợi ý gộp đơn thông minh
            </p>
            <p className="text-xs text-gray-400">
              Tự quét 3 đơn kế tiếp trong hàng chờ pha chế, gợi ý staff gộp các
              đơn trùng nhiều món để pha chung một lượt
            </p>
          </div>
          <Toggle
            checked={smartBatchingEnabled}
            onChange={(v) => patch({ smartBatchingEnabled: v })}
          />
        </div>
      </div>
```

- [x] **Step 3:** Sửa `e2e/admin-settings.spec.ts`: `const toggleTrack = page.locator("div.h-6.w-11").first();`

- [x] **Step 4:** `cd chalo-fe && pnpm lint` → PASS (kiểm tra type qua `pnpm exec tsc --noEmit` nếu cần).

- [x] **Step 5: Commit** — `git add chalo-fe && git commit -m "feat(fe): admin toggle for smart batching suggestion"`

---

### Task 3: FE logic core — orders.config, utils/batching (+unit test), prep.store

**Files:**
- Create: `chalo-fe/src/app/(staff)/staff/orders/orders.config.ts` (dời `KANBAN_COLUMNS`, `NEXT_STATUS`, `NEXT_STATUS_LABEL` ra khỏi `page.tsx`)
- Modify: `chalo-fe/src/app/(staff)/staff/orders/_components/KanbanColumn.tsx`, `OrderCard.tsx` (đổi import `../page` → `../orders.config`)
- Create: `chalo-fe/src/utils/batching.ts`
- Create: `chalo-fe/src/stores/prep.store.ts`
- Test: `chalo-fe/e2e/batching.unit.spec.ts` (Playwright chạy pure function, không cần browser/BE)

**Interfaces (Produces):**
- `orders.config.ts`: export y nguyên `KANBAN_COLUMNS`, `NEXT_STATUS`, `NEXT_STATUS_LABEL` + `LEFT_STATUSES: OrderStatus[] = ["PENDING","CONFIRMED","READY"]`.
- `utils/batching.ts`:
  - `suggestionSignature(orderIds: string[]): string` — sorted join `"+"`.
  - `computeBatchSuggestion(queue: OrderDto[]): BatchSuggestion | null` — quét tối đa 3 đơn đầu `queue` (caller đã sort cũ→mới), xét tập con (bộ 3 trước, rồi 3 cặp), điểm = số productId chung của MỌI đơn trong tập; lấy điểm cao nhất (≥1), tie ưu tiên tập lớn hơn; trả `{ orderIds, commonProducts: {productId, productName, totalQuantity}[], signature }`.
- `stores/prep.store.ts` (zustand persist key `chalo-prep-store`):
  - `ticks: Record<string, boolean[]>` — key `` `${orderId}:${itemId}` ``, mảng dài `quantity`.
  - `batches: Record<string, string[]>` — batchId → orderIds.
  - `dismissed: string[]` — signature gợi ý đã bỏ qua.
  - actions: `toggleTick(orderId, itemId, unitIndex, quantity)`, `createBatch(orderIds): void`, `dissolveBatch(batchId)`, `dismiss(signature)`, `prune(activeOrderIds: string[])` (xoá ticks/batch-member của order không còn active; batch còn <2 member thì giải tán; dismissed giữ tối đa 20).

- [x] **Step 1: Viết unit test fail trước** — `e2e/batching.unit.spec.ts` với các case: (a) queue <2 đơn → null; (b) 3 đơn cùng chung 1 món → gộp cả 3; (c) chỉ 2/3 đơn trùng → gợi ý đúng cặp có nhiều món chung nhất; (d) không đơn nào trùng → null; (e) chỉ quét 3 đơn đầu — đơn thứ 4 trùng cũng bị bỏ qua; (f) signature ổn định không phụ thuộc thứ tự. Chạy `pnpm exec playwright test e2e/batching.unit.spec.ts` → FAIL (module chưa tồn tại).

- [x] **Step 2: Implement `utils/batching.ts` + `orders.config.ts` + đổi import + `prep.store.ts`** (code đầy đủ — xem diff commit; giữ nguyên object config copy verbatim từ page.tsx).

- [x] **Step 3:** `pnpm exec playwright test e2e/batching.unit.spec.ts` → PASS; `pnpm lint` PASS; `pnpm exec tsc --noEmit` PASS.

- [x] **Step 4: Commit** — `git add chalo-fe && git commit -m "feat(fe): prep-station logic core (batching util + prep store + orders config)"`

---

### Task 4: FE UI — SplitPane + PrepStation/PrepTicket + rewrite page

**Files:**
- Create: `chalo-fe/src/app/(staff)/staff/orders/_components/SplitPane.tsx`
- Create: `chalo-fe/src/app/(staff)/staff/orders/_components/PrepStation.tsx`
- Create: `chalo-fe/src/app/(staff)/staff/orders/_components/PrepTicket.tsx`
- Modify: `chalo-fe/src/app/(staff)/staff/orders/page.tsx` (rewrite: split layout, giữ SSE/beep/refetch/modal)
- Test: `chalo-fe/e2e/staff-prep.spec.ts` (smoke: login staff → thấy separator + heading "Đang pha chế"; resize bằng bàn phím đổi width; KHÔNG mutate DB)

**Chi tiết bắt buộc:**
- `SplitPane`: props `{ left, right, storageKey, defaultRatio = 9/13, minRatio = 0.25, maxRatio = 0.78 }`. Drag bằng Pointer Events + `setPointerCapture`; double-click reset default; keyboard (`role="separator"`, `tabIndex=0`, ←/→ ±2%, Home/End = min/max); lưu localStorage khi thả/kết thúc; label `aria-label="Kéo để chỉnh tỷ lệ hai vùng"`. Tỷ lệ mặc định 9/13 ≈ 69% trái — đúng tinh thần "3-3-3-4" (mỗi cột trái 3 phần, khu pha chế 4 phần, rộng hơn từng cột).
- Cột trái: 3 `KanbanColumn` (PENDING/CONFIRMED/READY) như cũ, min-width 240px, overflow-x auto.
- `PrepStation`: header "☕ Đang pha chế (n)" + lưới `PrepTicket` (mỗi ticket = 1 order; batch nhiều order xử lý ở Task 5), empty state "Chưa có món nào đang pha".
- `PrepTicket` (chế độ 1 order): tên bàn + `#id`, mỗi item 1 hàng: tên món + note (📝) + `quantity` ô checkbox vuông to (touch-friendly, `size-7`) tick từng ly (đọc/ghi `prep.store.ticks`); progress bar `ticked/total`; khi đủ 100% → nút "Sẵn sàng →" đổi nhấn mạnh (pulse); nút gọi `onStatusChange(orderId, "READY")` như cũ.
- `page.tsx`: giữ nguyên SSE + beep + refetch + intercepted modal; thêm `useEffect` gọi `prune(activeOrderIds)` khi data đổi; PREPARING orders sort cũ→mới.

- [x] **Step 1:** Implement 3 component + rewrite page (code đầy đủ trong commit).
- [x] **Step 2:** `pnpm lint` + `pnpm exec tsc --noEmit` PASS.
- [x] **Step 3:** Viết `e2e/staff-prep.spec.ts` smoke (chạy ở Task 7 khi có server; spec dùng `process.env.E2E_BASE_URL`). Sửa `playwright.config.ts`: `baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000"`.
- [x] **Step 4: Commit** — `git commit -m "feat(fe): split-screen prep station with per-item ticklist"`

---

### Task 5: FE — Manual batching (chọn nhiều đơn → pha chung)

**Files:**
- Modify: `OrderCard.tsx` — props mới `selectable?: boolean; selected?: boolean; onToggleSelect?: (id: string) => void;` checkbox tròn góc trên-phải (stopPropagation để không mở modal).
- Modify: `KanbanColumn.tsx` — pass-through props chọn + slot `banner?: ReactNode` (Task 6 dùng).
- Modify: `PrepTicket.tsx` — chế độ batch: nhận `orders: OrderDto[]`; nhóm item theo `productId` (tổng số lượng "×N · k đơn"), mỗi unit checkbox có nhãn tên bàn (+note); nút "Tách nhóm" gọi `dissolveBatch`; mỗi order trong batch có nút "Sẵn sàng →" riêng khi các unit CỦA ORDER ĐÓ tick đủ.
- Modify: `PrepStation.tsx` — gom PREPARING orders theo `batches` từ store; order lẻ → ticket đơn.
- Modify: `page.tsx` — state `selected: Set<string>` (chỉ card CONFIRMED được chọn); action bar nổi khi chọn ≥2: "Pha chung (n) ▶" → tuần tự `updateStatus(id, "PREPARING")` từng order rồi `createBatch(ids)`, clear selection; nút "Bỏ chọn".

- [ ] **Step 1:** Implement như trên; tick trong batch vẫn key theo `orderId:itemId` nên tách nhóm không mất tiến độ.
- [ ] **Step 2:** `pnpm lint` + `tsc --noEmit` PASS.
- [ ] **Step 3: Commit** — `git commit -m "feat(fe): manual batching - select confirmed orders and prep together"`

---

### Task 6: FE — Smart batching suggestion + gate theo settings

**Files:**
- Create: `chalo-fe/src/app/(staff)/staff/orders/_components/BatchSuggestion.tsx`
- Modify: `page.tsx` — tính `suggestion = smartEnabled ? computeBatchSuggestion(confirmedQueue) : null` (memo; `confirmedQueue` = CONFIRMED sort cũ→mới); ẩn nếu `signature ∈ dismissed`; render banner ở đầu cột CONFIRMED (slot `banner`).
- `BatchSuggestion.tsx`: thẻ nổi bật (border brand, icon 💡): "Gợi ý: N đơn trùng M món — pha chung 1 lượt?" + liệt kê tên món chung (`commonProducts`), 2 nút: **"Gộp & pha ngay"** (dùng chung handler `startBatch(orderIds)` của Task 5) và **"Bỏ qua"** (`dismiss(signature)`).
- Gate: `const { data: settings } = useGetSettings();` → `const smartEnabled = settings?.smartBatchingEnabled ?? true;` (GET /settings public, staff gọi được).

- [ ] **Step 1:** Implement.
- [ ] **Step 2:** `pnpm lint` + `tsc --noEmit` PASS.
- [ ] **Step 3: Commit** — `git commit -m "feat(fe): smart batching suggestion gated by admin setting"`

---

### Task 7: Chạy migration + servers + verify end-to-end

- [ ] **Step 1:** `cd chalo-be && pnpm run migration:run` (DB 5433 dùng chung — migration additive, an toàn).
- [ ] **Step 2:** Chạy BE: `PORT=8082 CORS_ORIGIN=http://localhost:3020 pnpm start:dev` (background). Smoke: `curl localhost:8082/api/settings` → có `smartBatchingEnabled: true`.
- [ ] **Step 3:** Chạy FE: `NEXT_PUBLIC_API_BASE_URL=http://localhost:8082/api INTERNAL_API_BASE_URL=http://localhost:8082/api pnpm dev -p 3020` (background).
- [ ] **Step 4:** BE jest toàn bộ settings + FE `pnpm exec playwright test e2e/batching.unit.spec.ts`; e2e smoke `E2E_BASE_URL=http://localhost:3020 pnpm exec playwright test e2e/staff-prep.spec.ts`.
- [ ] **Step 5:** Verify bằng browser (Playwright MCP): login staff/staff → tạo 3 đơn test qua POS/menu → thấy suggestion → gộp → tick từng món → Sẵn sàng; login admin/admin → tắt toggle → suggestion biến mất; kéo resizer; reload giữ tick + tỷ lệ. Dọn đơn test (CANCELLED/COMPLETED) sau khi verify.
- [ ] **Step 6:** Commit chốt + báo user: **FE http://localhost:3020, BE http://localhost:8082** để test trước khi merge.
