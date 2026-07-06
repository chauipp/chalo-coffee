# 06 — FE Staff: Pager Token (Thẻ bàn) Management + Receipt Printing

**Goal:** Add two staff-facing FE features to Chalo Coffee (`g:\Chalo\chalo-fe`):
- **(A) Pager Token / "Thẻ bàn" management** — staff assign a physical pager number when creating a counter order in POS, see the board of active pagers with status, and release/complete a pager when the customer returns it.
- **(B) Receipt printing** — a `Receipt.tsx` component with a "tạm tính" (draft/pre-bill) view and a "hóa đơn" (final) view, printed through the **browser print API** (`window.print()` + a print-only CSS layout). No thermal-printer hardware.

**Architecture:** Next.js App Router, `(staff)` route group. React Query (`@tanstack/react-query`) for server state, Zustand for auth. Service layer split per resource under `src/services/<resource>/` (`*.api.ts` / `*.types.ts` / `*.queries.ts`, optional `index.ts` barrel). All HTTP goes through `request` in `src/lib/api-client.ts`, which unwraps the BE envelope `{ code, message, data }` and returns `data` directly. Endpoints centralised in `src/constants/api-endpoints.ts` (`API.*`); query keys in `src/constants/query-keys.ts` (`QUERY_KEYS.*`).

**Tech Stack:** Next.js (modified — see Global Constraints), React 19, TypeScript, Tailwind CSS **v4** (`@import "tailwindcss"` in `src/app/globals.css`, brand palette `brand-*`, dark mode via `dark:`), axios, sonner (`toast`).

**Depends on:** `04-be-pager-token.md` (BE pager module). This plan consumes the pager API. The **expected BE contract from 04** (grounded in existing NestJS conventions — wrapped `{code,message,data}`, controller under a resource prefix, ADMIN/MODERATOR guarded like `/order/active`) is:

| Method & path | Body / query | Returns (`data`) |
|---|---|---|
| `GET /pager/active` | — | `PagerDto[]` (status = `ACTIVE`) |
| `POST /pager/assign` | `{ orderId: string; number: number }` | `PagerDto` |
| `POST /pager/release` | `{ id: string }` | `PagerDto` (status → `COMPLETED`, `releasedAt` set) |

`PagerDto` = `{ id: string; number: number; orderId: string; tableName: string; status: "ACTIVE" | "COMPLETED"; totalAmount: number; assignedAt: string; releasedAt: string | null }`.

04 is **also expected to add an optional `pagerNumber: number | null`** to the order detail/active/table-order DTOs so the pager can be shown on the order detail modal, the table drawer, and the final receipt without a second lookup. This plan reads `order.pagerNumber` where available and otherwise falls back to matching the active-pager list by `orderId` (see Task 4), so it degrades gracefully if 04 ships the endpoints but not the DTO field.

> If 04's final field/route names differ, update `API.PAGER`, `src/services/pager/pager.types.ts`, and the two DTO reads — everything else keys off the service layer.

> **⚠️ RECONCILED WITH FINAL 04 (authoritative — this supersedes the "expected" table above).** Plan `04-be-pager-token.md` shipped a **3-state** lifecycle, not the 2-state guess. Apply these three adjustments while implementing:
> 1. **Routes:** list is `GET /pager/list` (NOT `/pager/active`); plus `POST /pager/assign`, `POST /pager/call`, `POST /pager/release`. Set `API.PAGER = { LIST: "/pager/list", ASSIGN: "/pager/assign", CALL: "/pager/call", RELEASE: "/pager/release" }`. All are **staff-only** (`@Roles(ADMIN, MODERATOR)`) — the bearer token is sent automatically, no `skipAuth`.
> 2. **Status enum is `WAITING | ASSIGNED | COMPLETED`** (default `ASSIGNED` at assign time), NOT `ACTIVE | COMPLETED`. In `pager.types.ts` use `PAGER_STATUS = ["WAITING","ASSIGNED","COMPLETED"] as const`. Treat **both `ASSIGNED` and `WAITING` as "active"** (show on the board); only `COMPLETED` leaves the board. Lifecycle: `assign → ASSIGNED` (khách cầm thẻ, đang pha) → `call → WAITING` (đồ xong, thẻ rung, chờ khách lên lấy) → `release → COMPLETED` (thu thẻ).
> 3. **Add a third action to the active-pager board (Task 3): a "Gọi / Sẵn sàng" button** that calls `POST /pager/call` with `{ id }` to flip `ASSIGNED → WAITING`. Render `WAITING` rows visually distinct (e.g. `brand`/amber highlight) so staff see which drinks are ready for pickup. `release` stays as the "Thu thẻ" action.
>
> The order-linked field 04 adds is `order.pagerNumber` (via `POST /order/create` accepting an optional `pagerNumber`) — the fallback-by-`orderId` logic in Task 4 still applies if that DTO field is absent.

---

## Global Constraints

1. **⚠️ This is a MODIFIED Next.js — read the docs first.** Per `g:\Chalo\chalo-fe\AGENTS.md`, APIs/conventions/file-structure may differ from training data. **Before writing or editing any FE file in a task, read the relevant guide under `g:\Chalo\chalo-fe\node_modules\next\dist\docs\`.** Minimum required reading for this plan:
   - `node_modules/next/dist/docs/01-app/01-getting-started/` — Server vs Client Components, styling/CSS, project structure.
   - `node_modules/next/dist/docs/01-app/02-guides/` — pick what's relevant: `forms.md`, `tailwind-v3-css.md` (styling), `css-in-js.md`, `preserving-ui-state.md`.
   - Heed any deprecation notices and inline "AI agent hint" comments in those docs. Do **not** assume a doc's content from memory — open the file.
2. **`"use client"`** is required on every file using hooks, state, portals, `window`, or event handlers (all components in this plan are client components). Match the existing pattern: directive on line 1, then a `// src/...` path comment.
3. **Never call axios directly** — always go through `request` from `src/lib/api-client.ts`. It returns `data` (already unwrapped); do not read `res.data.data`.
4. **Money formatting**: use `value.toLocaleString("vi-VN")` + `đ`, matching POS/order-detail. Never hardcode currency formatting differently.
5. **All user-facing copy is Vietnamese**, matching existing pages ("Tạo đơn", "Thẻ bàn", "Tạm tính", "Hoá đơn").
6. **Follow the service-layer split** exactly (`*.api.ts` → `*.types.ts` → `*.queries.ts`); register endpoints in `API` and keys in `QUERY_KEYS`. Do not inline fetch calls in components.
7. **Dark mode**: every color utility needs a `dark:` counterpart, matching existing components.
8. **No new dependencies.** Print uses the native `window.print()` — do not add `react-to-print` or any package.
9. **Verification has no automated test harness** for these pages. Verify with the dev server (`rtk pnpm dev` from `g:\Chalo\chalo-fe`), a logged-in staff session, and the concrete manual checks in each task. Type-check with `rtk pnpm tsc --noEmit` (or `rtk pnpm build`) before committing.

---

## Task 1 — Pager service layer (types, api, queries, constants)

Create the `pager` resource service consuming the 04 contract, and register its endpoints/keys.

**Files:**
- `g:\Chalo\chalo-fe\src\services\pager\pager.types.ts` (new)
- `g:\Chalo\chalo-fe\src\services\pager\pager.api.ts` (new)
- `g:\Chalo\chalo-fe\src\services\pager\pager.queries.ts` (new)
- `g:\Chalo\chalo-fe\src\services\pager\index.ts` (new)
- `g:\Chalo\chalo-fe\src\constants\api-endpoints.ts` (edit — add `PAGER` block)
- `g:\Chalo\chalo-fe\src\constants\query-keys.ts` (edit — add `PAGERS`)

**`pager.types.ts`:**
```ts
// src/services/pager/pager.types.ts

export const PAGER_STATUS = ["ACTIVE", "COMPLETED"] as const;
export type PagerStatus = (typeof PAGER_STATUS)[number];

export interface PagerDto {
  id: string;
  number: number;
  orderId: string;
  tableName: string;
  status: PagerStatus;
  totalAmount: number;
  assignedAt: string;
  releasedAt: string | null;
}

export interface AssignPagerPayload {
  orderId: string;
  number: number;
}

export interface ReleasePagerPayload {
  id: string;
}
```

**`api-endpoints.ts`** — add after the `ORDER` block (mirror its style):
```ts
  PAGER: {
    ACTIVE: "/pager/active",
    ASSIGN: "/pager/assign",
    RELEASE: "/pager/release",
  },
```

**`pager.api.ts`:**
```ts
// src/services/pager/pager.api.ts
import { API } from "@/constants";
import { request } from "@/lib/api-client";
import { AssignPagerPayload, PagerDto, ReleasePagerPayload } from "./pager.types";

export const getActivePagers = (): Promise<PagerDto[]> =>
  request.get(API.PAGER.ACTIVE);

export const assignPager = (data: AssignPagerPayload): Promise<PagerDto> =>
  request.post(API.PAGER.ASSIGN, data);

export const releasePager = (data: ReleasePagerPayload): Promise<PagerDto> =>
  request.post(API.PAGER.RELEASE, data);
```

**`query-keys.ts`** — add a `PAGERS` block inside `QUERY_KEYS`:
```ts
  PAGERS: {
    ALL: ["pagers"] as const,
    ACTIVE: ["pagers", "active"] as const,
  },
```

**`pager.queries.ts`:**
```ts
"use client";
// src/services/pager/pager.queries.ts
import { QUERY_KEYS } from "@/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { assignPager, getActivePagers, releasePager } from "./pager.api";
import { AssignPagerPayload, ReleasePagerPayload } from "./pager.types";

export const useGetActivePagers = () =>
  useQuery({
    queryKey: QUERY_KEYS.PAGERS.ACTIVE,
    queryFn: getActivePagers,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

export const useAssignPager = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignPagerPayload) => assignPager(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PAGERS.ACTIVE });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ACTIVE });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useReleasePager = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ReleasePagerPayload) => releasePager(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PAGERS.ACTIVE });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ACTIVE });
      toast.success("Đã trả thẻ bàn");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
```

**`index.ts`:**
```ts
// src/services/pager/index.ts
export * from "./pager.api";
export * from "./pager.types";
export * from "./pager.queries";
```

**Verify:**
- `rtk pnpm tsc --noEmit` from `g:\Chalo\chalo-fe` → no type errors.
- Grep-check: `API.PAGER.ACTIVE` resolves and `QUERY_KEYS.PAGERS.ACTIVE` resolves in the queries file (no red squiggles).

**Commit:** `rtk git add -A && rtk git commit -m "feat(fe): add pager service layer (api/types/queries)"`

---

## Task 2 — Assign a pager number when creating a counter order (POS)

In POS, capture an optional pager number alongside the table selector, and after the order is created assign that number to the new order. The order panel already has a comment block labelled `{/* table & pager selector */}` (page.tsx line ~160) — the input belongs there.

**Files:**
- `g:\Chalo\chalo-fe\src\app\(staff)\staff\pos\page.tsx` (edit)

**Changes in `page.tsx`:**

1. Import the assign hook near the other service imports:
```ts
import { useAssignPager } from "@/services/pager";
```

2. Add state next to the existing `selectedTableToken` state:
```ts
const [pagerNumber, setPagerNumber] = useState<string>("");
```

3. Instantiate the mutation next to `createOrderMutation`:
```ts
const assignPagerMutation = useAssignPager();
```

4. In `handleSubmit`, after `createOrderMutation.mutateAsync(...)` resolves to `order`, assign the pager if a number was entered — **before** clearing state. Wrap in its own try so a pager failure does not lose the created order:
```ts
      const order = await createOrderMutation.mutateAsync({
        tableToken: selectedTableToken,
        note: note.trim() || undefined,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          note: item.note?.trim() || undefined,
        })),
      });

      const pagerNo = Number(pagerNumber.trim());
      if (pagerNumber.trim() && Number.isInteger(pagerNo) && pagerNo > 0) {
        try {
          await assignPagerMutation.mutateAsync({ orderId: order.id, number: pagerNo });
          toast.success(`Đã gán thẻ bàn #${pagerNo}`);
        } catch {
          toast.error("Tạo đơn thành công nhưng gán thẻ bàn thất bại");
        }
      }

      toast.success(`Tạo đơn thành công - #${order.id.slice(-6).toUpperCase()}`);
      clearCart();
      setSelectedTableToken("");
      setPagerNumber("");
      setNote("");
```

5. Add the pager input inside the `{/* table & pager selector */}` block, right after the closing `</div>` of the "Bàn *" field (before the "Ghi chú cho bàn" field), matching the existing input styling:
```tsx
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Thẻ bàn (số)
            </label>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={pagerNumber}
              onChange={(e) => setPagerNumber(e.target.value)}
              placeholder="VD: 12"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm px-3 py-2 text-gray-900 dark:text-gray-100 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 placeholder:text-gray-400"
            />
          </div>
```

**Verify:**
- `rtk pnpm dev`, log in as staff, open `http://localhost:3000/staff/pos`.
- Add ≥1 product, pick a bàn, type a pager number (e.g. `12`), press **Tạo đơn** → confirm dialog → confirm.
- Expect two toasts: "Đã gán thẻ bàn #12" and "Tạo đơn thành công - #XXXXXX". Cart clears, pager input clears.
- Create an order **without** a pager number → only the "Tạo đơn thành công" toast, no assign call fired (check Network tab: no `POST /pager/assign`).
- Enter `0` or non-numeric → no assign call, order still created.

**Commit:** `rtk git add -A && rtk git commit -m "feat(fe): assign pager number on POS order creation"`

---

## Task 3 — Active pager board with release (POS)

Add a `PagerBoard` component listing active pagers with status and a **Trả thẻ** (release/complete) action, surfaced on the POS page (staff at the counter own the buzzers). Render it as a slide-over triggered from the POS order-panel header so it never competes with the product grid for space.

**Files:**
- `g:\Chalo\chalo-fe\src\app\(staff)\staff\pos\_components\PagerBoard.tsx` (new)
- `g:\Chalo\chalo-fe\src\app\(staff)\staff\pos\page.tsx` (edit — add toggle button + render)

**`PagerBoard.tsx`:**
```tsx
"use client";
// src/app/(staff)/staff/pos/_components/PagerBoard.tsx
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { useGetActivePagers, useReleasePager } from "@/services/pager";

interface PagerBoardProps {
  open: boolean;
  onClose: () => void;
}

export const PagerBoard = ({ open, onClose }: PagerBoardProps) => {
  const { data: pagers, isLoading } = useGetActivePagers();
  const releaseMutation = useReleasePager();

  if (!open) return null;

  const active = pagers ?? [];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Thẻ bàn</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {active.length} thẻ đang hoạt động
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <SpinnerIcon className="size-8 animate-spin text-brand-400" />
            </div>
          ) : active.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center text-gray-400">
              <span className="text-3xl mb-2">🔔</span>
              <p className="text-sm">Chưa có thẻ nào đang dùng</p>
            </div>
          ) : (
            active.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-800 px-3 py-2.5"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20 text-base font-bold text-brand-600 dark:text-brand-400">
                  {p.number}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {p.tableName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {p.totalAmount.toLocaleString("vi-VN")}đ · #
                    {p.orderId.slice(-6).toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={() => releaseMutation.mutate({ id: p.id })}
                  disabled={releaseMutation.isPending}
                  className="shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  Trả thẻ
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
```

**`page.tsx` edits:**

1. Import at top:
```ts
import { PagerBoard } from "./_components/PagerBoard";
```
2. Add state:
```ts
const [showPagerBoard, setShowPagerBoard] = useState(false);
```
3. In the order-panel header (`{/* header */}` block, the `<div>` holding "Đơn tại quầy"), make it a flex row with a trigger button:
```tsx
        <div className="px-4 py-3.5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100">
              Đơn tại quầy
            </h2>
            {totalItems > 0 && (
              <p className="text-xs text-gray-400">{totalItems} món</p>
            )}
          </div>
          <button
            onClick={() => setShowPagerBoard(true)}
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            🔔 Thẻ bàn
          </button>
        </div>
```
4. Render the board at the end of the returned fragment, next to the `ConfirmDialog`s:
```tsx
      <PagerBoard open={showPagerBoard} onClose={() => setShowPagerBoard(false)} />
```

**Verify:**
- On `/staff/pos`, create an order with pager `12` (Task 2). Click **🔔 Thẻ bàn** → slide-over lists a card showing `12`, the table name, total, and short order id.
- Click **Trả thẺ** → toast "Đã trả thẻ bàn", the card disappears (list invalidates).
- With no active pagers, the empty state "Chưa có thẻ nào đang dùng" shows.
- The board auto-refreshes (assign a pager in another POS tab; within ~15s it appears without manual reload — `refetchInterval`).

**Commit:** `rtk git add -A && rtk git commit -m "feat(fe): active pager board with release on POS"`

---

## Task 4 — Surface the pager number on order detail + table drawer (read-only)

Show which pager a customer holds where staff inspect an order. Prefer `order.pagerNumber` (from 04); fall back to matching the active-pager list by `orderId`.

**Files:**
- `g:\Chalo\chalo-fe\src\services\order\order.types.ts` (edit — add optional field)
- `g:\Chalo\chalo-fe\src\app\(staff)\staff\orders\@modal\(.)orders\[orderId]\page.tsx` (edit)

**`order.types.ts`** — add to `OrderDto` (optional, so BE lag is safe):
```ts
export interface OrderDto {
  id: string;
  tableId: string;
  tableName: string;
  tableToken: string;
  items: OrderItemDto[];
  status: OrderStatus;
  paidStatus: boolean;
  totalAmount: number;
  estimateWaitMinutes: number | null;
  note: string | null;
  pagerNumber?: number | null; // ← from 04-be-pager-token
  createdAt: string;
  updatedAt: string;
}
```

**Order detail modal** — resolve a pager number (prop-or-lookup) and render a badge in the meta row. Add imports:
```ts
import { useGetActivePagers } from "@/services/pager";
```
Inside the component, after `const { data: order } = useGetOrderById(orderId);`:
```ts
  const { data: activePagers } = useGetActivePagers();
  const pagerNumber =
    order?.pagerNumber ??
    activePagers?.find((p) => p.orderId === order?.id)?.number ??
    null;
```
In the `{/* meta */}` block, next to the status pill, render the badge when present:
```tsx
                  {pagerNumber != null && (
                    <span className="text-sm font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-3 py-1 rounded-full">
                      🔔 Thẻ {pagerNumber}
                    </span>
                  )}
```
(Place it inside the existing `flex items-center justify-between` meta row — wrap the status pill + this badge in a `<div className="flex items-center gap-2">` if needed so both sit on the right.)

**Verify:**
- Create an order with pager `7` in POS. Go to `/staff/orders`, open that order card → modal shows "🔔 Thẻ 7" beside the status.
- Open an order created **without** a pager → no badge, no layout break.
- After the pager is released (Task 3), reopening the order shows no badge (fallback lookup no longer matches; and `pagerNumber` from a released order should be null per 04).

**Commit:** `rtk git add -A && rtk git commit -m "feat(fe): show pager number on staff order detail"`

---

## Task 5 — Receipt component (draft "tạm tính" + final "hoá đơn") with print CSS

Create the presentational receipt and the print-only stylesheet. The receipt is hidden on screen and revealed only during printing via a body-visibility trick keyed to `#receipt-print`, so the surrounding modal/POS UI never bleeds into the printout.

**Files:**
- `g:\Chalo\chalo-fe\src\components\shared\Receipt.tsx` (new)
- `g:\Chalo\chalo-fe\src\app\globals.css` (edit — append print block)

**`globals.css`** — append at the end of the file (after existing `@theme`/utilities):
```css
/* ── Receipt printing ─────────────────────────────────────────── */
/* On screen the receipt is hidden; only #receipt-print is visible
   when printing so no surrounding UI (modal, POS panels) leaks in. */
.receipt-print-root {
  display: none;
}

@media print {
  body * {
    visibility: hidden;
  }
  #receipt-print,
  #receipt-print * {
    visibility: visible;
  }
  #receipt-print {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    width: 80mm; /* standard receipt roll width */
    margin: 0;
    padding: 4mm;
    color: #000;
    background: #fff;
    font-family: ui-monospace, "Courier New", monospace;
    font-size: 12px;
    line-height: 1.4;
  }
  .receipt-print-root {
    display: block;
  }
  @page {
    margin: 0;
  }
}
```

**`Receipt.tsx`:**
```tsx
"use client";
// src/components/shared/Receipt.tsx
import { OrderDto } from "@/services/order/order.types";

export type ReceiptVariant = "draft" | "final";

interface ReceiptProps {
  order: OrderDto;
  variant: ReceiptVariant;
  /** Physical pager/thẻ bàn number, if any. Falls back to order.pagerNumber. */
  pagerNumber?: number | null;
  shopName?: string;
  shopAddress?: string;
}

const SHOP_NAME = "Chalo Coffee";

export const Receipt = ({
  order,
  variant,
  pagerNumber,
  shopName = SHOP_NAME,
  shopAddress = "",
}: ReceiptProps) => {
  const isDraft = variant === "draft";
  const title = isDraft ? "PHIẾU TẠM TÍNH" : "HOÁ ĐƠN THANH TOÁN";
  const pager = pagerNumber ?? order.pagerNumber ?? null;
  const printedAt = new Date().toLocaleString("vi-VN");

  return (
    // .receipt-print-root keeps this out of the on-screen flow; #receipt-print
    // is the only node made visible by the @media print rules in globals.css.
    <div className="receipt-print-root" aria-hidden>
      <div id="receipt-print">
        {/* header */}
        <div style={{ textAlign: "center", marginBottom: "6px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700 }}>{shopName}</div>
          {shopAddress && <div>{shopAddress}</div>}
          <div style={{ marginTop: "4px", fontWeight: 700 }}>{title}</div>
        </div>

        {/* meta */}
        <div style={{ borderTop: "1px dashed #000", paddingTop: "4px" }}>
          <div>Bàn: {order.tableName}</div>
          <div>Đơn: #{order.id.slice(-6).toUpperCase()}</div>
          {pager != null && <div>Thẻ bàn: {pager}</div>}
          <div>Thời gian: {printedAt}</div>
        </div>

        {/* items */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "6px" }}>
          <thead>
            <tr style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000" }}>
              <th style={{ textAlign: "left", padding: "2px 0" }}>Món</th>
              <th style={{ textAlign: "center" }}>SL</th>
              <th style={{ textAlign: "right" }}>T.Tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td style={{ padding: "2px 0" }}>
                  {item.productName}
                  {item.note ? ` (${item.note})` : ""}
                </td>
                <td style={{ textAlign: "center" }}>{item.quantity}</td>
                <td style={{ textAlign: "right" }}>
                  {item.subtotal.toLocaleString("vi-VN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* total */}
        <div
          style={{
            borderTop: "1px dashed #000",
            marginTop: "6px",
            paddingTop: "4px",
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 700,
            fontSize: "14px",
          }}
        >
          <span>TỔNG CỘNG</span>
          <span>{order.totalAmount.toLocaleString("vi-VN")}đ</span>
        </div>

        {/* footer */}
        <div style={{ textAlign: "center", marginTop: "8px" }}>
          {isDraft ? (
            <div>* Phiếu tạm tính — chưa phải hoá đơn thanh toán *</div>
          ) : (
            <div>
              {order.paidStatus ? "Đã thanh toán" : "Chưa thanh toán"}
              <div style={{ marginTop: "4px" }}>Cảm ơn quý khách!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

Notes:
- Inline `style` (not Tailwind) is deliberate for the print body — Tailwind utilities apply screen theme colors and the receipt must be black-on-white regardless of the app's dark mode; inline styles inside `#receipt-print` are self-contained and print-predictable.
- **draft vs final** differ in: title ("PHIẾU TẠM TÍNH" vs "HOÁ ĐƠN THANH TOÁN"), and footer (draft shows the "chưa phải hoá đơn" disclaimer; final shows paid status + thanks).

**Verify (visual, via a throwaway mount):** temporarily render `<Receipt order={someOrder} variant="draft" />` on `/staff/pos`, open the browser Print dialog (Ctrl+P):
- Print preview shows **only** the receipt (80mm-ish narrow column), not the POS UI.
- Draft: title "PHIẾU TẠM TÍNH", footer disclaimer present, no "Đã thanh toán".
- Switch to `variant="final"`: title "HOÁ ĐƠN THANH TOÁN", footer shows paid/unpaid + "Cảm ơn quý khách!".
- On screen (not printing) nothing renders (component is `display:none`).
- Remove the throwaway mount before committing (real wiring is Task 6).

**Commit:** `rtk git add -A && rtk git commit -m "feat(fe): Receipt component with draft/final views + print CSS"`

---

## Task 6 — Wire print buttons into order detail modal (final) and POS pre-bill (draft)

Add "In tạm tính" / "In hoá đơn" buttons that mount the `Receipt` and call `window.print()`.

**Files:**
- `g:\Chalo\chalo-fe\src\app\(staff)\staff\orders\@modal\(.)orders\[orderId]\page.tsx` (edit — final receipt + print button)

**Order detail modal edits:**

1. Import:
```ts
import { Receipt } from "@/components/shared/Receipt";
```
2. Add a print handler inside the component:
```ts
  const handlePrint = () => window.print();
```
3. In the modal footer, always render a print button (independent of the status-transition button that only shows for `NEXT_STATUS[order.status]`). Replace the footer block so the print button is available whenever `order` is loaded. Example footer:
```tsx
          {order && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
              <button
                onClick={handlePrint}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                🖨️ In hoá đơn
              </button>
              {NEXT_STATUS[order.status] && (
                <button
                  onClick={() => handleStatusChange(NEXT_STATUS[order.status]!)}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-400 hover:bg-brand-500 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50"
                >
                  {updateStatusMutation.isPending && (
                    <SpinnerIcon className="size-4 animate-spin" />
                  )}
                  Chuyển trạng thái →
                </button>
              )}
            </div>
          )}
```
4. Mount the receipt (hidden on screen) inside the component's returned tree, after the modal markup, so it is in the DOM when `window.print()` fires:
```tsx
      {order && (
        <Receipt order={order} variant="final" pagerNumber={pagerNumber} />
      )}
```
(`pagerNumber` is the resolved value from Task 4.)

**Optional draft in POS (same pattern, if a pre-bill is wanted before checkout):** the POS page builds orders from a local cart (`useCart`) that has no `OrderDto` yet, so a POS draft receipt would need a synthetic `OrderDto`. Given the counter flow creates the order immediately, the **final** receipt from the order detail modal covers the printing requirement; the **draft** ("tạm tính") variant is exercised from the order detail modal too by rendering a second hidden `<Receipt variant="draft" />` behind an "In tạm tính" button if staff want a pre-bill for an unpaid order. Add, next to the print button, when `!order.paidStatus`:
```tsx
              {!order.paidStatus && (
                <button
                  onClick={handlePrint}
                  className="flex-1 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  🧾 In tạm tính
                </button>
              )}
```
and render the draft receipt behind it. Because both variants can't print at once (each mounts its own `#receipt-print`), gate which receipt is mounted with a small state:
```ts
  const [printVariant, setPrintVariant] = useState<"draft" | "final">("final");
  const printAs = (v: "draft" | "final") => {
    setPrintVariant(v);
    // let the DOM swap before printing
    requestAnimationFrame(() => window.print());
  };
```
Point "In tạm tính" → `printAs("draft")`, "In hoá đơn" → `printAs("final")`, and render a single `<Receipt order={order} variant={printVariant} pagerNumber={pagerNumber} />`. **Only one `#receipt-print` may exist in the DOM at a time** — do not mount both variants simultaneously.

**Verify:**
- `/staff/orders`, open an unpaid order → footer shows "🧾 In tạm tính" and "🖨️ In hoá đơn".
- Click **In tạm tính** → Print dialog preview shows "PHIẾU TẠM TÍNH" with the disclaimer, correct items/total, and the pager line if the order holds a thẻ.
- Click **In hoá đơn** → preview shows "HOÁ ĐƠN THANH TOÁN" with paid/unpaid state.
- Cancel the print dialog → modal is intact, no leftover receipt visible on screen.
- Open a paid order → only "🖨️ In hoá đơn" shows (no draft button); final receipt reads "Đã thanh toán".
- Confirm the surrounding modal/backdrop does **not** appear in the print preview (only the receipt).

**Commit:** `rtk git add -A && rtk git commit -m "feat(fe): print receipt buttons (draft + final) in order detail"`

---

## Task 7 — Full-flow verification + type/build gate

**Files:** none (verification only).

**Steps:**
1. `rtk pnpm tsc --noEmit` (or `rtk pnpm build`) from `g:\Chalo\chalo-fe` → clean.
2. `rtk pnpm dev`, staff login. End-to-end:
   - POS: add products → pick bàn → enter thẻ `15` → **Tạo đơn**. Toasts: "Đã gán thẻ bàn #15", "Tạo đơn thành công".
   - POS **🔔 Thẻ bàn** board: card `15` present with table + total.
   - `/staff/orders`: open the new order → "🔔 Thẻ 15" badge; print draft + final, verify preview content and that only the receipt prints.
   - Back in POS board → **Trả thẻ** on `15` → toast, card gone.
   - Reopen the order → badge gone (pager released).
3. Regression: create an order with **no** pager → no assign call, order flows normally; order detail prints without a pager line.
4. Dark mode: toggle app theme → POS pager input, PagerBoard, and the order badge all have correct `dark:` styling; the **printed** receipt stays black-on-white in both themes.

**Commit (if any doc/cleanup):** `rtk git add -A && rtk git commit -m "chore(fe): verify pager + receipt staff flows"`
