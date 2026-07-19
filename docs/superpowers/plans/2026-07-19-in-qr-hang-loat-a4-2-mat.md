# In QR hàng loạt (4 thẻ/tờ A4, 2 mặt khớp cắt) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps AND task headers use checkbox (`- [ ]`) syntax for tracking — check off a task's box only when all its steps are done and verified, so an interrupted session can resume by scanning this file alone.

**Goal:** Cho admin chọn nhiều bàn rồi in ra tờ A4 gồm 4 thẻ QR A6 (2×2), in được 2 mặt với mặt sau đảo vị trí để cắt ra chồng khít mặt trước.

**Architecture:** Tái dùng component `QrA6Sheet` đã tách. Thêm 1 hàm thuần dàn tờ (`qr-sheet-layout.ts`), 1 component 1 mặt A4 (`A4Face`), 1 route in (`print-sheet`), và checkbox chọn bàn ở trang Bàn & QR. Logic đảo mặt sau tách khỏi UI để test được.

**Tech Stack:** Next.js 16 (app router, standalone), React, TailwindCSS v4 (@theme), Playwright (unit + visual).

## Global Constraints
- Thẻ A6 = 105×148mm; 4 thẻ = 210×296mm trên A4 210×297mm → in tràn lề.
- Mặt trước ô theo thứ tự `[0,1,2,3]` = `TL,TR,BL,BR`.
- Mặt sau: `long` → `[1,0,3,2]` (đứng); `short` → `[2,3,0,1]` (xoay 180°).
- Không sửa API/back-end. Không sửa `DataTable` dùng chung.
- Reasoning nội bộ tiếng Anh, chữ hiển thị + commit tiếng Việt.
- Unit test = Playwright spec `*.unit.spec.ts` import hàm thuần từ `src/utils/` (theo `prep-grouping.unit.spec.ts`). Chạy: `pnpm exec playwright test <file> --project=chromium`.
- Chạy app trong worktree: `pnpm build` rồi `node .next/standalone/server.js` (KHÔNG `next dev`/`next start` — xem memory inotify + standalone).

---

### Task 1: Tách `@page` khỏi `A6_PRINT_CSS` để trang sheet dùng `@page A4` [ ]

**Files:**
- Modify: `chalo-fe/src/app/(print)/admin/tables/[tableId]/print/QrA6Sheet.tsx` (xóa rule `@page` đầu `A6_PRINT_CSS`)
- Modify: `chalo-fe/src/app/(print)/admin/tables/[tableId]/print/page.tsx` (tự khai `@page` A6 trong style riêng)

**Interfaces:**
- Produces: `A6_PRINT_CSS` (không còn chứa `@page`), `QrA6Sheet` (giữ nguyên).

- [ ] **Step 1: Xóa rule `@page` khỏi đầu `A6_PRINT_CSS`**

Trong `QrA6Sheet.tsx`, bỏ 2 dòng đầu của template `A6_PRINT_CSS`:
```
  @page { size: 105mm 148mm; margin: 0; }

```
(giữ nguyên phần còn lại bắt đầu từ `/* Tấm A6: kích thước vật lý cố định */`).

- [ ] **Step 2: Thêm `@page` A6 vào style riêng của trang in đơn**

Trong `page.tsx`, ở block `<style>` "CSS riêng của trang", thêm dòng đầu:
```css
        @page { size: 105mm 148mm; margin: 0; }
```

- [ ] **Step 3: Build kiểm tra không lỗi**

Run: `cd chalo-fe && pnpm build 2>&1 | tail -5`
Expected: build xong, route `/admin/tables/[tableId]/print` compile OK.

- [ ] **Step 4: Commit**

```bash
git add chalo-fe/src/app/\(print\)/admin/tables/\[tableId\]/print/QrA6Sheet.tsx chalo-fe/src/app/\(print\)/admin/tables/\[tableId\]/print/page.tsx
git commit -m "refactor(fe): tách @page khỏi A6_PRINT_CSS để tái dùng cho khổ khác"
```

---

### Task 2: Hàm thuần dàn tờ + đảo mặt sau (`qr-sheet-layout.ts`) [ ]

**Files:**
- Create: `chalo-fe/src/utils/qr-sheet-layout.ts`
- Test: `chalo-fe/e2e/qr-sheet-layout.unit.spec.ts`

**Interfaces:**
- Produces:
  - `type FlipMode = "long" | "short"`
  - `chunkSheets<T>(items: T[], size?: number): (T | null)[][]` — chia `size` (mặc định 4) phần tử/tờ, đệm `null` cho ô trống tờ cuối; `[]` khi rỗng.
  - `backOrder(mode: FlipMode): number[]` — `long`→`[1,0,3,2]`, `short`→`[2,3,0,1]`.
  - `needsRotate180(mode: FlipMode): boolean` — `true` khi `short`.

- [ ] **Step 1: Viết test thất bại**

Create `chalo-fe/e2e/qr-sheet-layout.unit.spec.ts`:
```ts
import { test, expect } from "@playwright/test";
import {
  chunkSheets,
  backOrder,
  needsRotate180,
} from "../src/utils/qr-sheet-layout";

test("chunkSheets chia 4/tờ và đệm null tờ cuối", () => {
  expect(chunkSheets([1, 2, 3, 4, 5])).toEqual([
    [1, 2, 3, 4],
    [5, null, null, null],
  ]);
});

test("chunkSheets rỗng trả []", () => {
  expect(chunkSheets([])).toEqual([]);
});

test("chunkSheets vừa đủ 4 không thừa ô", () => {
  expect(chunkSheets([1, 2, 3, 4])).toEqual([[1, 2, 3, 4]]);
});

test("backOrder long = đảo cột [1,0,3,2]", () => {
  expect(backOrder("long")).toEqual([1, 0, 3, 2]);
});

test("backOrder short = đảo hàng [2,3,0,1]", () => {
  expect(backOrder("short")).toEqual([2, 3, 0, 1]);
});

test("needsRotate180 chỉ true khi short", () => {
  expect(needsRotate180("long")).toBe(false);
  expect(needsRotate180("short")).toBe(true);
});
```

- [ ] **Step 2: Chạy test để chắc chắn fail**

Run: `cd chalo-fe && pnpm exec playwright test e2e/qr-sheet-layout.unit.spec.ts --project=chromium`
Expected: FAIL (Cannot find module `../src/utils/qr-sheet-layout`).

- [ ] **Step 3: Viết implementation tối thiểu**

Create `chalo-fe/src/utils/qr-sheet-layout.ts`:
```ts
// src/utils/qr-sheet-layout.ts
// Logic thuần dàn thẻ A6 lên tờ A4 và đảo vị trí mặt sau để in 2 mặt cắt khớp.
export type FlipMode = "long" | "short";

/** Chia items thành từng tờ `size` ô; đệm null cho ô trống ở tờ cuối. */
export function chunkSheets<T>(items: T[], size = 4): (T | null)[][] {
  const sheets: (T | null)[][] = [];
  for (let i = 0; i < items.length; i += size) {
    const cells: (T | null)[] = items.slice(i, i + size);
    while (cells.length < size) cells.push(null);
    sheets.push(cells);
  }
  return sheets;
}

/**
 * Hoán vị chỉ số ô cho MẶT SAU (mặt trước luôn [0,1,2,3] = TL,TR,BL,BR).
 * - long  (lật cạnh dài):  đảo cột  -> [1,0,3,2]
 * - short (lật cạnh ngắn): đảo hàng -> [2,3,0,1]
 */
export function backOrder(mode: FlipMode): number[] {
  return mode === "long" ? [1, 0, 3, 2] : [2, 3, 0, 1];
}

/** Lật cạnh ngắn cần xoay 180° từng thẻ mặt sau để lật lên đọc xuôi. */
export function needsRotate180(mode: FlipMode): boolean {
  return mode === "short";
}
```

- [ ] **Step 4: Chạy test để chắc pass**

Run: `cd chalo-fe && pnpm exec playwright test e2e/qr-sheet-layout.unit.spec.ts --project=chromium`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add chalo-fe/src/utils/qr-sheet-layout.ts chalo-fe/e2e/qr-sheet-layout.unit.spec.ts
git commit -m "feat(fe): hàm dàn 4 thẻ/tờ A4 + đảo mặt sau (kèm unit test)"
```

---

### Task 3: Component 1 mặt A4 (`A4Face.tsx`) + CSS lưới/vạch cắt [ ]

**Files:**
- Create: `chalo-fe/src/app/(print)/admin/tables/print-sheet/A4Face.tsx`

**Interfaces:**
- Consumes: `QrA6Sheet` từ `../[tableId]/print/QrA6Sheet`; `TableDto`.
- Produces:
  - `type SheetCell = { table: TableDto; menuUrl: string } | null`
  - `A4Face({ cells, rotate180, showCutMarks }: { cells: SheetCell[]; rotate180: boolean; showCutMarks?: boolean }): JSX.Element` — `cells` đúng 4 phần tử theo thứ tự ô TL,TR,BL,BR.
  - `A4_FACE_CSS: string` — CSS lưới A4 + ô + vạch cắt (KHÔNG chứa `@page`).

- [ ] **Step 1: Tạo `A4Face.tsx`**

```tsx
// src/app/(print)/admin/tables/print-sheet/A4Face.tsx
import { TableDto } from "@/services/table";
import { QrA6Sheet } from "../[tableId]/print/QrA6Sheet";

export type SheetCell = { table: TableDto; menuUrl: string } | null;

/** Một mặt giấy A4 = lưới 2×2 thẻ A6 (mỗi ô 105×148mm). */
export const A4Face = ({
  cells,
  rotate180,
  showCutMarks = true,
}: {
  cells: SheetCell[];
  rotate180: boolean;
  showCutMarks?: boolean;
}) => (
  <div className="a4-sheet bg-white">
    <div className="a4-grid">
      {cells.map((cell, i) => (
        <div className="a4-cell" key={i}>
          {cell ? (
            rotate180 ? (
              <div className="rot180">
                <QrA6Sheet table={cell.table} menuUrl={cell.menuUrl} />
              </div>
            ) : (
              <QrA6Sheet table={cell.table} menuUrl={cell.menuUrl} />
            )
          ) : null}
        </div>
      ))}
    </div>
    {showCutMarks && (
      <>
        <div className="cut-line cut-v" />
        <div className="cut-line cut-h" />
      </>
    )}
  </div>
);

export const A4_FACE_CSS = `
  .a4-sheet {
    position: relative;
    width: 210mm;
    height: 297mm;
    overflow: hidden;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .a4-grid {
    display: grid;
    grid-template-columns: 105mm 105mm;
    grid-template-rows: 148mm 148mm;
    width: 210mm;
    height: 296mm;
  }
  .a4-cell { width: 105mm; height: 148mm; overflow: hidden; }
  .a4-cell .rot180 { transform: rotate(180deg); width: 105mm; height: 148mm; }
  /* Vạch cắt: chữ thập mảnh giữa tờ, trùng nhau cả 2 mặt (trục tâm bất biến khi lật) */
  .cut-line { position: absolute; background: rgba(120,120,120,0.5); }
  .cut-v { top: 0; left: 105mm; width: 0.2mm; height: 296mm; transform: translateX(-0.1mm); }
  .cut-h { left: 0; top: 148mm; height: 0.2mm; width: 210mm; transform: translateY(-0.1mm); }
`;
```

- [ ] **Step 2: Build kiểm tra type/compile**

Run: `cd chalo-fe && pnpm build 2>&1 | tail -5`
Expected: build OK (route `/qr-preview` và các route hiện có compile; A4Face chưa có route riêng nên chỉ cần không lỗi type — sẽ được dùng ở Task 4).

- [ ] **Step 3: Commit**

```bash
git add chalo-fe/src/app/\(print\)/admin/tables/print-sheet/A4Face.tsx
git commit -m "feat(fe): component 1 mặt A4 (lưới 2x2 thẻ A6 + vạch cắt)"
```

---

### Task 4: Route in hàng loạt (`print-sheet/page.tsx`) [ ]

**Files:**
- Create: `chalo-fe/src/app/(print)/admin/tables/print-sheet/page.tsx`

**Interfaces:**
- Consumes: `A4Face`, `A4_FACE_CSS`, `SheetCell`; `A6_PRINT_CSS`, `QrA6Sheet` gián tiếp; `chunkSheets`, `backOrder`, `needsRotate180`, `FlipMode`; `useGetTableList`, `useSearchParams`.

- [ ] **Step 1: Tạo `print-sheet/page.tsx`**

```tsx
"use client";
// src/app/(print)/admin/tables/print-sheet/page.tsx
// In hàng loạt: mỗi tờ A4 = 4 thẻ A6 (2×2), có mặt trước + mặt sau đảo để cắt khớp.
import { A6_PRINT_CSS } from "../[tableId]/print/QrA6Sheet";
import { useGetTableList } from "@/services/table";
import {
  backOrder,
  chunkSheets,
  needsRotate180,
  type FlipMode,
} from "@/utils/qr-sheet-layout";
import { useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { A4Face, A4_FACE_CSS, type SheetCell } from "./A4Face";

export default function PrintSheetPage() {
  const searchParams = useSearchParams();
  const ids = (searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const { data: tables, isLoading } = useGetTableList();
  const [flip, setFlip] = useState<FlipMode>("long");

  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );

  // giữ đúng thứ tự ids đã chọn
  const chosen = ids
    .map((id) => tables?.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const selected: SheetCell[] = chosen.map((table) => ({
    table,
    menuUrl: origin ? `${origin}/menu/${table.qrToken}` : "",
  }));

  const sheets = chunkSheets(selected, 4);
  const order = backOrder(flip);
  const rotate = needsRotate180(flip);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Toolbar — chỉ màn hình */}
      <header className="qr-screen-only sticky top-0 z-10 border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              In QR hàng loạt — {selected.length} bàn · {sheets.length} tờ A4 (2 mặt)
            </p>
            <p className="text-xs text-gray-400">
              Bật “In tràn lề/Borderless”, tỉ lệ 100% (không “fit to page”). Nên in thử 1 tờ trước.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              Kiểu lật:
              <select
                value={flip}
                onChange={(e) => setFlip(e.target.value as FlipMode)}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <option value="long">Cạnh dài (mặc định)</option>
                <option value="short">Cạnh ngắn</option>
              </select>
            </label>
            <button
              onClick={() => window.print()}
              disabled={selected.length === 0}
              className="rounded-xl bg-brand-400 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500 disabled:opacity-50"
            >
              🖨️ In
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-col items-center gap-8 px-4 py-8">
        {isLoading ? (
          <p className="qr-screen-only py-20 text-gray-500">Đang tải…</p>
        ) : selected.length === 0 ? (
          <p className="qr-screen-only py-20 text-gray-500">
            Không có bàn để in. Hãy chọn bàn ở trang Bàn &amp; QR.
          </p>
        ) : (
          sheets.map((frontCells, s) => {
            const backCells = order.map((i) => frontCells[i]);
            return (
              <div key={s} className="flex flex-col items-center gap-6">
                <div className="sheet-block">
                  <p className="qr-screen-only mb-2 text-xs font-medium text-gray-500">
                    Tờ {s + 1} — Mặt trước
                  </p>
                  <div className="a4-zoom drop-shadow-xl">
                    <A4Face cells={frontCells} rotate180={false} />
                  </div>
                </div>
                <div className="sheet-block">
                  <p className="qr-screen-only mb-2 text-xs font-medium text-gray-500">
                    Tờ {s + 1} — Mặt sau (đã đảo)
                  </p>
                  <div className="a4-zoom drop-shadow-xl">
                    <A4Face cells={backCells} rotate180={rotate} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

      <style>{A6_PRINT_CSS}</style>
      <style>{A4_FACE_CSS}</style>
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        @media screen {
          .a4-zoom { zoom: 0.5; }
        }
        @media print {
          .qr-screen-only { display: none !important; }
          body * { visibility: visible !important; }
          main { padding: 0 !important; gap: 0 !important; }
          .a4-zoom { zoom: 1; filter: none; }
          .sheet-block { margin: 0 !important; }
          .a4-sheet { page-break-after: always; break-after: page; }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Build**

Run: `cd chalo-fe && pnpm build 2>&1 | tail -6`
Expected: route `/admin/tables/print-sheet` xuất hiện, build OK.

- [ ] **Step 3: Commit**

```bash
git add chalo-fe/src/app/\(print\)/admin/tables/print-sheet/page.tsx
git commit -m "feat(fe): trang in QR hàng loạt A4 2 mặt (toggle kiểu lật)"
```

---

### Task 5: Chọn bàn (checkbox + thanh thao tác) ở trang Bàn & QR [ ]

**Files:**
- Modify: `chalo-fe/src/app/(admin)/admin/tables/page.tsx`

**Interfaces:**
- Consumes: route `/admin/tables/print-sheet?ids=...`.

- [ ] **Step 1: Thêm state chọn + cột checkbox + thanh thao tác**

Trong `TablesPage`:
1. Thêm import `useMemo` nếu cần; thêm state:
```tsx
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
```
2. Thêm helper trong component:
```tsx
  const toggleId = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const allIds = tables.map((t) => t.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const openPrintSheet = () => {
    const ordered = allIds.filter((id) => selectedIds.has(id));
    if (ordered.length === 0) return;
    window.open(`/admin/tables/print-sheet?ids=${ordered.join(",")}`, "_blank");
  };
```
3. Thêm cột checkbox vào ĐẦU mảng `columns`:
```tsx
    {
      key: "select",
      header: "Chọn",
      width: "56px",
      render: (row: TableDto) => (
        <input
          type="checkbox"
          aria-label={`Chọn ${row.name}`}
          checked={selectedIds.has(row.id)}
          onChange={() => toggleId(row.id)}
          className="size-4 accent-brand-500"
        />
      ),
    },
```
(đặt object này là phần tử đầu tiên của `columns`.)

- [ ] **Step 2: Thêm thanh thao tác phía trên bảng**

Ngay TRƯỚC `<DataTable ... />`, thêm:
```tsx
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-800 dark:bg-brand-900/20">
          <p className="text-sm font-medium text-brand-800 dark:text-brand-200">
            Đã chọn {selectedIds.size} bàn
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setSelectedIds(allSelected ? new Set() : new Set(allIds))
              }
              className="rounded-lg border border-brand-300 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/40"
            >
              {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
            <button
              onClick={openPrintSheet}
              className="rounded-lg bg-brand-400 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-500"
            >
              🖨️ In QR (4 bàn/tờ)
            </button>
          </div>
        </div>
      )}
```

- [ ] **Step 3: Build**

Run: `cd chalo-fe && pnpm build 2>&1 | tail -5`
Expected: build OK.

- [ ] **Step 4: Commit**

```bash
git add chalo-fe/src/app/\(admin\)/admin/tables/page.tsx
git commit -m "feat(fe): chọn nhiều bàn + nút in QR hàng loạt ở trang Bàn & QR"
```

---

### Task 6: Mở rộng `/qr-preview` để duyệt 4-up 2 mặt + verify trực quan [ ]

**Files:**
- Modify: `chalo-fe/src/app/(print)/qr-preview/page.tsx` (TẠM — xóa trước khi merge)

**Interfaces:**
- Consumes: `A4Face`, `A4_FACE_CSS`; `chunkSheets`, `backOrder`, `needsRotate180`.

- [ ] **Step 1: Thêm khối demo 4-up 2 mặt vào `/qr-preview`**

Dưới thẻ đơn hiện có, thêm 4 bàn mẫu, dựng 1 tờ mặt trước + mặt sau (mode `long`) bằng `A4Face`, thu nhỏ `zoom` để xem. Import `A4Face, A4_FACE_CSS` và các hàm layout; tạo `MOCK_TABLES` (4 bàn: "Bàn 1".."Bàn 4"), map thành `SheetCell`, `chunkSheets(...)[0]` → front, `backOrder("long").map(i=>front[i])` → back. Thêm `<style>{A4_FACE_CSS}</style>` và `.a4-zoom{zoom:0.42}` cho khối này.

- [ ] **Step 2: Build + chạy standalone server**

```bash
cd chalo-fe && pnpm build 2>&1 | tail -3
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public 2>/dev/null || true
# (server 3007 nếu đang chạy sẽ tự phục vụ bản mới sau khi restart)
```
Khởi động lại server 3007: dừng tiến trình cũ rồi `PORT=3007 HOSTNAME=0.0.0.0 node .next/standalone/server.js`.

- [ ] **Step 3: Verify trực quan bằng Playwright**

Navigate `http://localhost:3007/qr-preview`, chụp khối 4-up 2 mặt. Mắt kiểm tra: mặt trước `1,2,3,4` (TL,TR,BL,BR); mặt sau `2,1,4,3` (đảo cột); vạch cắt chữ thập trùng tâm cả 2 mặt.

- [ ] **Step 4: Commit**

```bash
git add chalo-fe/src/app/\(print\)/qr-preview/page.tsx
git commit -m "chore(fe): preview tạm 4-up 2 mặt để duyệt (xóa trước khi merge)"
```

---

## Self-Review
- **Spec coverage:** Chọn bàn (T5) ✓ · route in 4-up 2 mặt (T4) ✓ · đảo mặt sau long/short + xoay (T2, T4) ✓ · A6 sát mép/@page A4 (T1, T3, T4) ✓ · vạch cắt (T3) ✓ · tái dùng QrA6Sheet + không lặp (T1,T3,T4) ✓ · preview không backend (T6) ✓ · edge case rỗng/lẻ (T2 chunk + T4 empty message) ✓ · unit test (T2) ✓ · visual test (T6) ✓.
- **Placeholder scan:** không có TBD; code đầy đủ mỗi step.
- **Type consistency:** `FlipMode`, `SheetCell`, `chunkSheets/backOrder/needsRotate180`, `A4Face(cells,rotate180,showCutMarks)`, `A4_FACE_CSS` dùng nhất quán giữa T2/T3/T4/T6.
