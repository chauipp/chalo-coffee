# 07 — FE Admin Dashboard

## Goal
Turn the stub `chalo-fe/src/app/(admin)/admin/dashboard/page.tsx` ("Phrase 7 - chart") into a real
admin dashboard: three stat cards (total revenue, total orders, top product), a revenue chart with a
day/week/month period toggle + date-range selector, and a top-products chart/list. All data comes from
two already-live BE endpoints.

## Architecture
- **Data layer** already partially scaffolded in `src/services/order/` (`order.api.ts`, `order.queries.ts`,
  `order.types.ts`) and `src/constants/` (`API.ORDER.STATS_*`, `QUERY_KEYS.REVENUE.*`, `Period` enum).
  This plan **extends** that scaffolding to pass an optional `from`/`to` date range, then builds the UI.
- **UI layer**: new presentational components under
  `src/app/(admin)/admin/dashboard/_components/` (matches the co-located `_components` convention used by
  `menu/products/_components/`), consumed by the client-component `page.tsx`.
- **Charts**: `recharts` (already a dependency — see Tech Stack).

## Tech Stack
Next.js (**modified fork** — see Global Constraints), React 19, TypeScript, `@tanstack/react-query` v5,
`recharts` v3, Tailwind v4, axios via `src/lib/api-client.ts`.

**Depends on:** none — BE stats endpoints already exist
(`GET /order/stats/revenue`, `GET /order/stats/top-products`).

---

## Global Constraints

1. **MODIFIED Next.js — READ THE DOCS FIRST.** Per `chalo-fe/AGENTS.md`, this is NOT the Next.js in your
   training data. Before writing ANY FE code, read the relevant guides in
   `chalo-fe/node_modules/next/dist/docs/` — at minimum `02-pages/` (App Router pages / client vs server
   components) and `03-architecture/`. Heed any deprecation notices. Do not assume APIs/file conventions
   from memory.
2. **Data-fetching pattern is fixed.** Components call React Query hooks from `src/services/order/order.queries.ts`.
   Hooks call thin API functions in `order.api.ts` that use `request` from `src/lib/api-client.ts`.
   The axios response interceptor **already unwraps** `{ code, message, data }` and returns `data` directly —
   so an API function that calls `request.get<RevenueStatsResult>(...)` resolves to the `data` payload, NOT
   the envelope. Do not re-unwrap.
3. **All new list/page components are Client Components** — first line `"use client";` (the existing admin
   pages all are). Charts and React Query hooks require the client.
4. **Reuse existing UI** from `src/components/shared/ui/` (`Select`, `Input`, `DataTable`, `Badge`). There is
   **no** `Card` component — create a small local `StatCard` in `_components/`.
5. **Styling conventions** (copy from `menu/products/page.tsx`): page root `<div className="p-6 space-y-5">`,
   header block with `h1.text-xl.font-bold.text-gray-900 dark:text-gray-100` + gray subtitle, brand color is
   `brand-400/500/600`, support dark mode (`dark:` variants), currency via `Number.toLocaleString("vi-VN")`
   with a trailing `đ`. All user-facing copy is **Vietnamese**.
6. **recharts is already installed** (`"recharts": "^3.8.1"` in `package.json`). No install task. If you find
   it missing at implementation time, `cd chalo-fe && rtk pnpm add recharts` as a prerequisite.
7. **Dataviz (keep simple, accessible):** one hue per series, brand color for revenue bars/line, a distinct
   accessible accent for order-count; always render axis labels + a tooltip; format Y-axis + tooltip values
   as VND; never rely on color alone (tooltip carries the label text).

---

## BE contract (verified — do not change BE)

`order.controller.ts` + `order.service.ts`:

**`GET /order/stats/revenue`** — ADMIN only, JWT. Query params (all optional):
- `period`: `'day' | 'week' | 'month'` (default `'day'`) — SQL group format.
- `from`, `to`: `YYYY-MM-DD` date range.
Response `data`:
```json
{
  "totalRevenue": 1200000,
  "totalOrders": 48,
  "data": [{ "date": "2026-05-05", "revenue": 500000, "orderCount": 20 }]
}
```
(For `week`, `date` looks like `2026-19`/`IYYY-IW`; for `month`, `2026-05`. Treat `date` as an opaque
axis label string.)

**`GET /order/stats/top-products`** — ADMIN only, JWT. Query params (all optional):
- `limit`: number (default `10`).
- `from`, `to`: `YYYY-MM-DD`.
Response `data`:
```json
[{ "productId": "uuid", "productName": "Ca phe sua", "totalQuantity": 120, "totalRevenue": 3000000 }]
```
Only PAID, non-CANCELLED orders are counted (BE handles this).

---

## Tasks

### Task 1 — Fix & extend stats types
**Files:** `chalo-fe/src/services/order/order.types.ts`

The existing `RevenueDataPoint` uses `label`, but the BE returns **`date`** — this is a latent bug. Correct
it and add param types.

Replace the existing `RevenueDataPoint` / `RevenueStatsResult` block and add param interfaces:
```ts
export interface RevenueDataPoint {
  date: string;        // BE field. day: "2026-05-05" | week: "2026-19" | month: "2026-05"
  revenue: number;
  orderCount: number;
}

export interface RevenueStatsResult {
  totalRevenue: number;
  totalOrders: number;
  data: RevenueDataPoint[];
}

export interface RevenueStatsParams {
  period?: Period;     // import from "@/services/types"
  from?: string;       // YYYY-MM-DD
  to?: string;         // YYYY-MM-DD
}

export interface TopProductsParams {
  limit?: number;
  from?: string;
  to?: string;
}
```
Keep the existing `TopProductItem` interface as-is (already matches BE). Ensure `Period` is imported:
`import type { Period } from "@/services/types";` (add if not already present).

**Verify:** `cd chalo-fe && rtk npx tsc --noEmit` — no type errors introduced by this file.

---

### Task 2 — Extend API functions to accept date range
**Files:** `chalo-fe/src/services/order/order.api.ts`

Replace the current `getRevenueStats(period)` and `getTopProducts(limit)` with param-object versions
(only send defined params so empty range = all-time):
```ts
import {
  // ...existing imports...
  RevenueStatsParams,
  RevenueStatsResult,
  TopProductsParams,
  TopProductItem,
} from "./order.types";

export const getRevenueStats = (
  params: RevenueStatsParams = {},
): Promise<RevenueStatsResult> =>
  request.get(API.ORDER.STATS_REVENUE, {
    params: {
      period: params.period ?? Period.DAY,
      ...(params.from ? { from: params.from } : {}),
      ...(params.to ? { to: params.to } : {}),
    },
  });

export const getTopProducts = (
  params: TopProductsParams = {},
): Promise<TopProductItem[]> =>
  request.get(API.ORDER.STATS_TOP_PRODUCTS, {
    params: {
      limit: params.limit ?? 5,
      ...(params.from ? { from: params.from } : {}),
      ...(params.to ? { to: params.to } : {}),
    },
  });
```
`API.ORDER.STATS_REVENUE` (`/order/stats/revenue`) and `API.ORDER.STATS_TOP_PRODUCTS`
(`/order/stats/top-products`) already exist in `src/constants/api-endpoints.ts` — do not add them.
Keep `Period` imported from `../types`.

**Verify:** `rtk npx tsc --noEmit` passes.

---

### Task 3 — Extend query keys + hooks for the date range
**Files:** `chalo-fe/src/constants/query-keys.ts`, `chalo-fe/src/services/order/order.queries.ts`

In `query-keys.ts`, replace the `REVENUE` block so the cache key includes the full param object (so changing
period or range refetches):
```ts
REVENUE: {
  STATS: (params: object) => ["orders", "stats", "revenue", params] as const,
  TOP_PRODUCTS: (params: object) =>
    ["orders", "stats", "top-products", params] as const,
},
```
In `order.queries.ts`, replace the two stats hooks:
```ts
import {
  // ...
  RevenueStatsParams,
  TopProductsParams,
} from "./order.types";

export const useGetRevenueStats = (params: RevenueStatsParams) =>
  useQuery({
    queryKey: QUERY_KEYS.REVENUE.STATS(params),
    queryFn: () => getRevenueStats(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData, // add keepPreviousData to the @tanstack import
  });

export const useGetTopProducts = (params: TopProductsParams = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.REVENUE.TOP_PRODUCTS(params),
    queryFn: () => getTopProducts(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
```
Add `keepPreviousData` to the existing `@tanstack/react-query` import in this file (so toggling
period/range doesn't flash empty charts). Update the call sites — there are none yet outside this feature.

**Verify:** `rtk npx tsc --noEmit` passes; grep confirms no other caller passes the old `period`/`limit`
positional args: `rtk grep "useGetRevenueStats\|useGetTopProducts" chalo-fe/src`.

---

### Task 4 — Currency/label format helpers
**Files:** `chalo-fe/src/utils/format.ts` (new)

Small shared helpers (no util exists today; keep tiny):
```ts
export const formatVnd = (n: number): string => `${(n ?? 0).toLocaleString("vi-VN")}đ`;

// Compact axis label, e.g. 1_200_000 -> "1,2tr", 45_000 -> "45k"
export const formatVndCompact = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")}tr`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n ?? 0);
};
```

**Verify:** `rtk npx tsc --noEmit` passes.

---

### Task 5 — StatCard component
**Files:** `chalo-fe/src/app/(admin)/admin/dashboard/_components/StatCard.tsx` (new)

Presentational card (no `Card` in the design system, so build one matching the rounded/border/dark-mode look
used across admin):
```tsx
"use client";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export function StatCard({ label, value, hint, icon, isLoading }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      {isLoading ? (
        <div className="mt-3 h-7 w-28 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
      ) : (
        <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      )}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
```

**Verify:** `rtk npx tsc --noEmit` passes.

---

### Task 6 — DashboardControls (period toggle + date range)
**Files:** `chalo-fe/src/app/(admin)/admin/dashboard/_components/DashboardControls.tsx` (new)

Controlled component; parent owns state. Uses the shared `Select` and native date `Input`s (reuse
`src/components/shared/ui/Input.tsx` which forwards native input props, so `type="date"` works).
```tsx
"use client";
import { Select } from "@/components/shared/ui/Select";
import { Input } from "@/components/shared/ui/Input";
import { Period } from "@/services/types";

export interface DashboardFilter {
  period: Period;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}

interface Props {
  value: DashboardFilter;
  onChange: (next: DashboardFilter) => void;
}

const PERIOD_OPTIONS = [
  { value: Period.DAY, label: "Theo ngày" },
  { value: Period.WEEK, label: "Theo tuần" },
  { value: Period.MONTH, label: "Theo tháng" },
];

export function DashboardControls({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        options={PERIOD_OPTIONS}
        value={value.period}
        onChange={(e) => onChange({ ...value, period: e.target.value as Period })}
        className="w-40"
      />
      <Input
        type="date"
        value={value.from ?? ""}
        onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
        className="w-44"
      />
      <span className="text-gray-400">→</span>
      <Input
        type="date"
        value={value.to ?? ""}
        onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
        className="w-44"
      />
      {(value.from || value.to) && (
        <button
          onClick={() => onChange({ ...value, from: undefined, to: undefined })}
          className="text-sm text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
        >
          Xoá khoảng ngày
        </button>
      )}
    </div>
  );
}
```
Confirm `Input` forwards `type`/`value`/`onChange` (it extends `InputHTMLAttributes`, like `Select`). If its
signature differs, adapt props accordingly (read the file first).

**Verify:** `rtk npx tsc --noEmit` passes.

---

### Task 7 — RevenueChart (recharts)
**Files:** `chalo-fe/src/app/(admin)/admin/dashboard/_components/RevenueChart.tsx` (new)

Bar chart of revenue per bucket with an overlaid line for order count. Accessible: axis titles, tooltip,
VND formatting.
```tsx
"use client";
import {
  ResponsiveContainer, ComposedContainer, // NOTE: use ComposedChart (see below)
} from "recharts";
import { RevenueDataPoint } from "@/services/order/order.types";
import { formatVnd, formatVndCompact } from "@/utils/format";
```
Implement with `ComposedChart` (bars + line). Import the exact recharts members:
`ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line`.
```tsx
export function RevenueChart({ data, isLoading }: { data: RevenueDataPoint[]; isLoading?: boolean }) {
  if (isLoading) {
    return <div className="h-72 w-full animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />;
  }
  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-gray-200 text-sm text-gray-400 dark:border-gray-700">
        Chưa có dữ liệu doanh thu
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Doanh thu</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis
            yAxisId="left"
            tickFormatter={formatVndCompact}
            tick={{ fontSize: 12 }}
            width={56}
          />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip
            formatter={(val: number, name: string) =>
              name === "Doanh thu" ? formatVnd(val) : val
            }
          />
          <Legend />
          <Bar yAxisId="left" dataKey="revenue" name="Doanh thu" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          <Line yAxisId="right" dataKey="orderCount" name="Số đơn" stroke="#2563eb" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
```
(`#f59e0b` ~ brand amber for revenue; `#2563eb` accessible blue for order count — distinct hues, tooltip
carries text labels so it doesn't rely on color alone. Remove the bogus `ComposedContainer` import shown in
the first snippet.)

**Verify:** `rtk npx tsc --noEmit` passes.

---

### Task 8 — TopProductsChart (horizontal bars + list fallback)
**Files:** `chalo-fe/src/app/(admin)/admin/dashboard/_components/TopProductsChart.tsx` (new)

Horizontal bar chart of `totalQuantity` per product, with product names on the Y axis and a revenue tooltip.
Import `ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar` from recharts.
```tsx
"use client";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";
import { TopProductItem } from "@/services/order/order.types";
import { formatVnd } from "@/utils/format";

export function TopProductsChart({ data, isLoading }: { data: TopProductItem[]; isLoading?: boolean }) {
  if (isLoading) return <div className="h-72 w-full animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />;
  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-gray-200 text-sm text-gray-400 dark:border-gray-700">
        Chưa có sản phẩm bán chạy
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Sản phẩm bán chạy</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
          <YAxis type="category" dataKey="productName" width={120} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(val: number, name: string) =>
              name === "Doanh thu" ? formatVnd(val) : `${val} ly`
            }
          />
          <Bar dataKey="totalQuantity" name="Số lượng" fill="#f59e0b" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Verify:** `rtk npx tsc --noEmit` passes.

---

### Task 9 — Assemble the dashboard page
**Files:** `chalo-fe/src/app/(admin)/admin/dashboard/page.tsx` (replace stub)

```tsx
"use client";
import { useState } from "react";
import { Period } from "@/services/types";
import { useGetRevenueStats, useGetTopProducts } from "@/services/order/order.queries";
import { formatVnd } from "@/utils/format";
import { StatCard } from "./_components/StatCard";
import { DashboardControls, DashboardFilter } from "./_components/DashboardControls";
import { RevenueChart } from "./_components/RevenueChart";
import { TopProductsChart } from "./_components/TopProductsChart";

export default function AdminDashboardPage() {
  const [filter, setFilter] = useState<DashboardFilter>({ period: Period.DAY });

  const revenueQuery = useGetRevenueStats(filter);
  const topProductsQuery = useGetTopProducts({ limit: 5, from: filter.from, to: filter.to });

  const revenue = revenueQuery.data;
  const topProducts = topProductsQuery.data ?? [];
  const bestSeller = topProducts[0];

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Tổng quan</h1>
          <p className="mt-0.5 text-sm text-gray-500">Doanh thu &amp; sản phẩm bán chạy</p>
        </div>
        <DashboardControls value={filter} onChange={setFilter} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Tổng doanh thu"
          value={formatVnd(revenue?.totalRevenue ?? 0)}
          icon="💰"
          isLoading={revenueQuery.isLoading}
        />
        <StatCard
          label="Tổng số đơn"
          value={String(revenue?.totalOrders ?? 0)}
          icon="🧾"
          isLoading={revenueQuery.isLoading}
        />
        <StatCard
          label="Bán chạy nhất"
          value={bestSeller?.productName ?? "—"}
          hint={bestSeller ? `${bestSeller.totalQuantity} ly đã bán` : undefined}
          icon="⭐"
          isLoading={topProductsQuery.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueChart data={revenue?.data ?? []} isLoading={revenueQuery.isLoading} />
        <TopProductsChart data={topProducts} isLoading={topProductsQuery.isLoading} />
      </div>
    </div>
  );
}
```
The page already renders inside `(admin)/layout.tsx` and is linked from the sidebar
(`ROUTES.ADMIN.DASHBOARD` = `/admin/dashboard`); no routing changes needed.

**Verify (typecheck + build):**
- `cd chalo-fe && rtk npx tsc --noEmit` — clean.
- `cd chalo-fe && rtk npm run lint` — clean.

---

### Task 10 — Manual verification (run the app end-to-end)
**Files:** none (verification only)

1. Start BE (`chalo-be`) and FE: `cd chalo-fe && rtk npm run dev`.
2. Log in as an **ADMIN** user (endpoints are ADMIN-role gated; a MODERATOR/CUSTOMER token gets 403 → charts
   would be empty). Navigate to `http://localhost:3000/admin/dashboard`.
3. **Stat cards:** "Tổng doanh thu" shows a VND figure ending in `đ`, "Tổng số đơn" shows an integer,
   "Bán chạy nhất" shows a product name + "N ly đã bán". Cross-check against the raw API:
   open devtools Network, confirm `GET /api/order/stats/revenue?period=day` returns
   `{ data: { totalRevenue, totalOrders, data:[...] } }` and the card value equals `totalRevenue`.
4. **Revenue chart:** bars render one per `date` bucket, blue order-count line overlaid, hovering a bar shows
   a tooltip with "Doanh thu: …đ" and "Số đơn: …". Y-axis left shows compact VND (e.g. `1,2tr`).
5. **Period toggle:** switch "Theo ngày → Theo tuần → Theo tháng"; X-axis labels change
   (`2026-05-05` → `2026-19` → `2026-05`) and a new network request fires with the new `period`. No empty
   flash between toggles (keepPreviousData).
6. **Date range:** pick a `from`/`to`; both charts + cards refetch with `&from=…&to=…` and numbers shrink to
   the range. "Xoá khoảng ngày" clears it back to all-time.
7. **Top products chart:** horizontal bars ordered by quantity (longest on top), product names on Y-axis,
   tooltip shows "Số lượng: N ly".
8. **Empty state:** with a future date range that has no paid orders, both charts show the Vietnamese
   "Chưa có dữ liệu…" placeholder instead of a broken chart.
9. **Dark mode:** toggle theme (next-themes) — cards/charts remain legible.

---

### Task 11 — Commit
**Files:** all of the above

```
rtk git add chalo-fe/src plans/07-fe-admin-dashboard.md
rtk git commit -m "feat(fe): admin dashboard with revenue + top-products charts"
```
(Use a branch if currently on a detached HEAD / main per repo policy. Do not push unless asked.)
