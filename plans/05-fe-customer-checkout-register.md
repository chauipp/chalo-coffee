# 05 — FE Customer: Batch Checkout Flow + Registration Page

**Goal:** Ship two customer-facing FE pieces on the Chalo Coffee storefront:
- **(A) Batch checkout ("scan once, pay all")** — a new page under the customer route group that previews every open order on a table, opens a single checkout session, and completes payment in one action, wired to the already-live BE endpoints `POST /order/checkout/preview`, `POST /order/checkout/start`, `POST /order/checkout/complete`.
- **(B) Customer registration** — a new `(auth)/register` page + form calling `POST /auth/register`, mirroring the existing login page/form/hook.

**Architecture:** Next.js (modified) App Router with route groups `(customer)` and `(auth)`. Data via a 3-layer service pattern per domain — `*.api.ts` (Axios `request` wrappers) → `*.queries.ts` (React Query hooks with `toast` + cache invalidation) → page/`_components`. Global auth in Zustand (`useAuthStore`, persisted). Axios interceptor in `src/lib/api-client.ts` unwraps `{ code, message, data }` → returns `data`, and auto-refreshes on 401.

**Tech Stack:** Next.js (modified), React Query (`@tanstack/react-query`), Zustand, Axios, react-hook-form + Zod, Tailwind, `sonner` toasts.

**Depends on:** `02-be-registration.md` (defines the `POST /auth/register` contract — build the auth service against the shape below and reconcile field names against 02 + the real BE code before wiring). BE checkout endpoints (`/order/checkout/*`) already exist and are `@Public()`.

---

## Global Constraints

- **⚠️ MODIFIED Next.js — read the docs first.** Per `g:\Chalo\chalo-fe\AGENTS.md`, this is NOT standard Next.js; APIs, conventions, and file structure may differ from training data. **Before writing any FE code**, read the relevant guide under `g:\Chalo\chalo-fe\node_modules\next\dist\docs\` — specifically `01-app/` (App Router: pages, layouts, route groups, `"use client"`, `useParams`/`useRouter` from `next/navigation`, `next/link`). Heed any deprecation notices there; if an API below conflicts with the installed docs, the docs win.
- **Follow the existing 3-layer service pattern.** New endpoints get: an entry in `src/constants/api-endpoints.ts` (`API.*`), a query key in `src/constants/query-keys.ts` (`QUERY_KEYS.*`), a function in `*.api.ts` using `request` from `@/lib/api-client`, and a hook in `*.queries.ts` (`"use client"`, `useMutation`/`useQuery`, `toast` on error, `queryClient.invalidateQueries` on success). Do NOT call Axios or `fetch` directly from components.
- **Response unwrapping is automatic.** `request.post<T>()` resolves to the BE `data` payload directly (the interceptor strips `code/message/data`). Type the generic as the inner shape — never `ApiResponse<T>`.
- **Customer endpoints are public / token-optional.** Order + checkout endpoints are `@Public()`; do not attach auth. The customer identity is the `tableToken` route param. Do NOT gate checkout behind `useAuthStore`.
- **Auth endpoints that must skip the bearer** pass `{ skipAuth: true } as never` as the 3rd arg to `request.post` (see `userLogin`). Use this for `userRegister`.
- **Match the storefront visual language exactly** — Tailwind `brand-*` palette, `rounded-2xl/3xl` cards, `dark:` variants on every color, sticky header + fixed bottom CTA, `SpinnerIcon` for pending states, Vietnamese copy, `.toLocaleString("vi-VN")` + `đ` for money. Mirror `cart/page.tsx` and `orders/page.tsx`.
- **No test runner is installed** (no vitest/jest/playwright in `package.json`). Each task's verify step is a concrete manual check (exact URL + expected UI/behavior). Run `rtk npm run dev` (Next dev server) and, before committing, `rtk npm run lint`.
- **Money/UUID types:** `totalAmount` is a number (VND, no decimals). `orderIds` are UUID v4 strings. `expiresAt` arrives as an ISO string.
- Use `rtk` prefix on all shell commands. Commit after each task with the message shown.

---

## Part A — Batch Checkout Flow

### Task A1 — Add checkout endpoints + query keys to constants

**Files:** `src/constants/api-endpoints.ts`, `src/constants/query-keys.ts`

In `api-endpoints.ts`, extend `API.ORDER` (keep existing keys) with the three checkout routes:

```ts
  ORDER: {
    CREATE: "/order/create",
    PAGE: "/order/page",
    ACTIVE: "/order/active",
    DETAIL: "/order/detail",
    BY_TOKEN: "/order/by-token",
    ESTIMATED_WAIT: "/order/estimated-wait",
    UPDATE_STATUS: "/order/status",
    REQUEST_PAYMENT: "/order/request-payment",
    PAY: "/order/pay",
    PAY_ALL: "/order/pay-all",
    CHECKOUT_PREVIEW: "/order/checkout/preview",
    CHECKOUT_START: "/order/checkout/start",
    CHECKOUT_COMPLETE: "/order/checkout/complete",
    STATS_REVENUE: "/order/stats/revenue",
    STATS_TOP_PRODUCTS: "/order/stats/top-products",
  },
```

In `query-keys.ts`, add a preview key inside `QUERY_KEYS.ORDERS`:

```ts
    BY_TABLE_TOKEN: (token: string) => ["orders", "table", token] as const,
    CHECKOUT_PREVIEW: (token: string) =>
      ["orders", "checkout", "preview", token] as const,
    ESTIMATED_WAIT: (orderId?: string) =>
```

**Verify:** `rtk npm run lint` passes; `tsc` (via `rtk npm run build` is heavy — prefer editor typecheck) shows no reference errors.
**Commit:** `rtk git add -A && rtk git commit -m "feat(fe): add checkout endpoint + query-key constants"`

---

### Task A2 — Checkout types in `order.types.ts`

**File:** `src/services/order/order.types.ts`

Append to section 3 (payloads) and add a new section for checkout results. Shapes are copied verbatim from the BE (`order.service.ts` `checkoutPreview`/`checkoutStart`/`checkoutComplete` and `checkout.dto.ts`). Reuse the existing `OrderDto`.

```ts
// ============================================================================
// 6. CHECKOUT (Batch "scan once, pay all")
// ============================================================================
export interface CheckoutPreviewPayload {
  tableToken: string;
  orderIds?: string[]; // optional: limit to these; else all open orders of the table
}

export interface CheckoutStartPayload extends CheckoutPreviewPayload {
  ttlMinutes?: number; // 5–120, default 15
}

export interface CheckoutCompletePayload {
  sessionId: string;
  tableToken: string;
  clientSecret: string;
}

export interface CheckoutPreviewResult {
  tableId: string;
  tableName: string;
  tableToken: string;
  orderIds: string[];
  totalAmount: number;
  orders: OrderDto[];
}

export interface CheckoutSessionResult {
  sessionId: string;
  clientSecret: string;
  tableToken: string;
  tableId: string;
  orderIds: string[];
  totalAmount: number;
  expiresAt: string; // ISO
  orders: OrderDto[];
}

export interface CheckoutCompleteResult {
  idempotent: boolean;
  sessionId: string;
  orderIds: string[];
  totalAmount: number;
  orders: OrderDto[];
}
```

**Verify:** typecheck clean; `OrderDto` import already in file (same module).
**Commit:** `rtk git add -A && rtk git commit -m "feat(fe): add checkout DTO types"`

---

### Task A3 — Checkout API functions in `order.api.ts`

**File:** `src/services/order/order.api.ts`

Add imports and three `request.post` wrappers (each resolves to the unwrapped BE `data`):

```ts
import {
  // ...existing imports...
  CheckoutPreviewPayload,
  CheckoutPreviewResult,
  CheckoutStartPayload,
  CheckoutSessionResult,
  CheckoutCompletePayload,
  CheckoutCompleteResult,
} from "./order.types";

export const checkoutPreview = (
  data: CheckoutPreviewPayload,
): Promise<CheckoutPreviewResult> =>
  request.post(API.ORDER.CHECKOUT_PREVIEW, data);

export const checkoutStart = (
  data: CheckoutStartPayload,
): Promise<CheckoutSessionResult> =>
  request.post(API.ORDER.CHECKOUT_START, data);

export const checkoutComplete = (
  data: CheckoutCompletePayload,
): Promise<CheckoutCompleteResult> =>
  request.post(API.ORDER.CHECKOUT_COMPLETE, data);
```

**Verify:** typecheck clean.
**Commit:** `rtk git add -A && rtk git commit -m "feat(fe): add checkout api functions"`

---

### Task A4 — Checkout React Query hooks in `order.queries.ts`

**File:** `src/services/order/order.queries.ts`

`preview` is a POST that reads → expose it as a `useQuery` (queryFn calls the POST) so the page auto-loads it. `start` and `complete` are `useMutation`. On complete, invalidate the table's orders + active queue so the orders page reflects paid status.

```ts
import {
  // ...existing api imports...
  checkoutPreview,
  checkoutStart,
  checkoutComplete,
} from "./order.api";
import {
  // ...existing type imports...
  CheckoutStartPayload,
  CheckoutCompletePayload,
} from "./order.types";

// ─── Checkout (batch) ───────────────────────────────────────────────────────
export const useCheckoutPreview = (tableToken: string) =>
  useQuery({
    queryKey: QUERY_KEYS.ORDERS.CHECKOUT_PREVIEW(tableToken),
    queryFn: () => checkoutPreview({ tableToken }),
    enabled: !!tableToken,
    staleTime: 10_000,
    retry: false, // BE throws if the table has no open orders — show empty state instead of retrying
  });

export const useCheckoutStart = () =>
  useMutation({
    mutationFn: (data: CheckoutStartPayload) => checkoutStart(data),
    onError: (e: Error) => toast.error(e.message),
  });

export const useCheckoutComplete = (tableToken: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CheckoutCompletePayload) => checkoutComplete(data),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.ORDERS.BY_TABLE_TOKEN(tableToken),
      });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ACTIVE });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.ORDERS.CHECKOUT_PREVIEW(tableToken),
      });
      toast.success("Thanh toán gộp thành công!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
```

**Verify:** typecheck clean; hooks exported.
**Commit:** `rtk git add -A && rtk git commit -m "feat(fe): add checkout react-query hooks"`

---

### Task A5 — Checkout summary component (`_components/CheckoutSummary.tsx`)

**File:** `src/app/(customer)/menu/[tableToken]/checkout/_components/CheckoutSummary.tsx`

Presentational: renders the previewed orders list + grand total. Reuses `OrderDto`. Styled like the "Tổng kết" block in `orders/page.tsx`.

```tsx
// src/app/(customer)/menu/[tableToken]/checkout/_components/CheckoutSummary.tsx
import { OrderDto } from "@/services/order/order.types";

export const CheckoutSummary = ({
  orders,
  totalAmount,
}: {
  orders: OrderDto[];
  totalAmount: number;
}) => {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 shadow-sm space-y-3">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {orders.length} đơn sẽ được thanh toán
      </p>
      <div className="space-y-2">
        {orders.map((o) => (
          <div key={o.id} className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-mono text-gray-400 dark:text-gray-500">
                Đơn #{o.id.slice(-6).toUpperCase()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {o.items.reduce((s, i) => s + i.quantity, 0)} món
              </p>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 shrink-0">
              {o.totalAmount.toLocaleString("vi-VN")}đ
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          Tổng cần thanh toán
        </span>
        <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
          {totalAmount.toLocaleString("vi-VN")}đ
        </span>
      </div>
    </div>
  );
};
```

**Verify:** file compiles; no runtime render yet (used in A7).
**Commit:** `rtk git add -A && rtk git commit -m "feat(fe): add CheckoutSummary component"`

---

### Task A6 — Session countdown component (`_components/CheckoutSessionPanel.tsx`)

**File:** `src/app/(customer)/menu/[tableToken]/checkout/_components/CheckoutSessionPanel.tsx`

Shows the open session: total, a live countdown to `expiresAt`, and a "confirm payment" button (simulates the customer completing at the payment gateway). Uses a 1s interval; when expired, disables confirm and surfaces a restart callback. Mirrors `PayAllConfirmModal` button styling.

```tsx
// src/app/(customer)/menu/[tableToken]/checkout/_components/CheckoutSessionPanel.tsx
"use client";
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { useEffect, useState } from "react";

export const CheckoutSessionPanel = ({
  totalAmount,
  expiresAt,
  onConfirm,
  onRestart,
  isPending,
}: {
  totalAmount: number;
  expiresAt: string;
  onConfirm: () => void;
  onRestart: () => void;
  isPending: boolean;
}) => {
  const [remainingMs, setRemainingMs] = useState<number>(
    () => new Date(expiresAt).getTime() - Date.now(),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setRemainingMs(new Date(expiresAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const expired = remainingMs <= 0;
  const mm = Math.max(0, Math.floor(remainingMs / 60000));
  const ss = Math.max(0, Math.floor((remainingMs % 60000) / 1000));

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 shadow-sm space-y-4">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Phiên thanh toán gộp
        </p>
        <p className="mt-2 text-3xl font-extrabold text-brand-600 dark:text-brand-400">
          {totalAmount.toLocaleString("vi-VN")}đ
        </p>
        <p
          className={`mt-2 text-sm font-medium ${
            expired
              ? "text-red-600 dark:text-red-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {expired
            ? "Phiên đã hết hạn"
            : `Hết hạn sau ${mm}:${ss.toString().padStart(2, "0")}`}
        </p>
      </div>

      {expired ? (
        <button
          onClick={onRestart}
          className="w-full rounded-2xl bg-brand-500 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 active:scale-[0.98] transition-all"
        >
          Tạo lại phiên thanh toán
        </button>
      ) : (
        <button
          onClick={onConfirm}
          disabled={isPending}
          className="w-full rounded-2xl bg-green-500 py-3.5 text-base font-semibold text-white hover:bg-green-600 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <SpinnerIcon className="size-5 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            "✓ Tôi đã thanh toán"
          )}
        </button>
      )}
    </div>
  );
};
```

**Verify:** compiles; countdown logic verified in A7 manual test.
**Commit:** `rtk git add -A && rtk git commit -m "feat(fe): add CheckoutSessionPanel with countdown"`

---

### Task A7 — Checkout page (`checkout/page.tsx`)

**File:** `src/app/(customer)/menu/[tableToken]/checkout/page.tsx`

Client component orchestrating the 3-step flow with local state (`review` → `session` → `done`). Header + layout copied from `orders/page.tsx`. Reads `tableToken` via `useParams`. Keeps `clientSecret`/`sessionId`/`expiresAt` in component state only (never persisted).

```tsx
// src/app/(customer)/menu/[tableToken]/checkout/page.tsx
"use client";
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import {
  useCheckoutPreview,
  useCheckoutStart,
  useCheckoutComplete,
} from "@/services/order/order.queries";
import { CheckoutSessionResult } from "@/services/order/order.types";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { CheckoutSummary } from "./_components/CheckoutSummary";
import { CheckoutSessionPanel } from "./_components/CheckoutSessionPanel";

export default function CheckoutPage() {
  const { tableToken } = useParams<{ tableToken: string }>();
  const router = useRouter();

  const { data: preview, isLoading, isError } = useCheckoutPreview(tableToken);
  const startMutation = useCheckoutStart();
  const completeMutation = useCheckoutComplete(tableToken);

  const [session, setSession] = useState<CheckoutSessionResult | null>(null);
  const [done, setDone] = useState<boolean>(false);

  const handleStart = async () => {
    const s = await startMutation.mutateAsync({ tableToken });
    setSession(s);
  };

  const handleComplete = async () => {
    if (!session) return;
    await completeMutation.mutateAsync({
      sessionId: session.sessionId,
      tableToken: session.tableToken,
      clientSecret: session.clientSecret,
    });
    setSession(null);
    setDone(true);
  };

  const handleRestart = () => setSession(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button
          onClick={() => router.push(`/menu/${tableToken}/orders`)}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          ← Quay lại
        </button>
        <h1 className="text-base font-bold text-gray-900 dark:text-white">
          Thanh toán một lần
        </h1>
      </header>

      <main className="p-4 space-y-4 pb-32">
        {done ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="size-20 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-4xl">
              🎉
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              Đã thanh toán tất cả đơn của bàn
            </p>
            <button
              onClick={() => router.push(`/menu/${tableToken}/orders`)}
              className="rounded-2xl bg-brand-500 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Xem đơn hàng
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <SpinnerIcon className="size-8 animate-spin text-brand-400" />
          </div>
        ) : isError || !preview || preview.orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400 dark:text-gray-500 text-center">
            <div className="size-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-4xl">
              ✅
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Không có đơn nào cần thanh toán
            </p>
            <button
              onClick={() => router.push(`/menu/${tableToken}`)}
              className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
            >
              Xem thực đơn
            </button>
          </div>
        ) : session ? (
          <CheckoutSessionPanel
            totalAmount={session.totalAmount}
            expiresAt={session.expiresAt}
            onConfirm={handleComplete}
            onRestart={handleRestart}
            isPending={completeMutation.isPending}
          />
        ) : (
          <CheckoutSummary
            orders={preview.orders}
            totalAmount={preview.totalAmount}
          />
        )}
      </main>

      {/* bottom CTA — only in review step */}
      {!done && !session && preview && preview.orders.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 py-4 z-30">
          <button
            onClick={handleStart}
            disabled={startMutation.isPending}
            className="w-full rounded-2xl bg-green-500 py-3.5 text-base font-semibold text-white hover:bg-green-600 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
          >
            {startMutation.isPending && (
              <SpinnerIcon className="size-5 animate-spin" />
            )}
            💳 Thanh toán {preview.totalAmount.toLocaleString("vi-VN")}đ
          </button>
        </div>
      )}
    </div>
  );
}
```

**Verify (manual):** `rtk npm run dev`, then in the storefront create ≥1 unpaid order on a table so you have a valid `tableToken`, and visit `http://localhost:3000/menu/<tableToken>/checkout`. Expect: (1) review step lists the open orders + total, (2) tapping "Thanh toán …đ" swaps to the session panel with a live `mm:ss` countdown, (3) tapping "Tôi đã thanh toán" shows the 🎉 success state and a success toast, (4) navigating to `/menu/<tableToken>/orders` shows those orders now marked "✓ Đã thanh toán". Also confirm a table with no unpaid orders shows the "Không có đơn nào cần thanh toán" empty state.
**Commit:** `rtk git add -A && rtk git commit -m "feat(fe): add batch checkout page"`

---

### Task A8 — Entry point from the orders page

**File:** `src/app/(customer)/menu/[tableToken]/orders/page.tsx`

Route customers into the new single-scan flow. Change the existing bottom "Thanh toán tất cả" button (which currently calls `usePayAllOrders` inline via the modal) to navigate to the checkout page instead, keeping the modal path removed to avoid two competing pay-all UIs. Minimal edit — replace the `onClick` of the green CTA:

```tsx
          {unpaidOrders.length > 0 && (
            <button
              onClick={() => router.push(`/menu/${tableToken}/checkout`)}
              className="w-full rounded-2xl bg-green-500 py-3.5 text-base font-semibold text-white hover:bg-green-600 active:scale-[0.98] transition-all shadow-sm"
            >
              💳 Thanh toán tất cả — {unpaidTotal.toLocaleString("vi-VN")}đ
            </button>
          )}
```

Then remove the now-unused `showPayAllConfirm` state, `handlePayAll`, `payAllMutation`, and the `<PayAllConfirmModal>` render (and its import) from this file. (Leave `PayAllConfirmModal.tsx` on disk; it is harmless and may be reused.)

**Verify (manual):** reload `/menu/<tableToken>/orders`; the green "Thanh toán tất cả" button now navigates to `/menu/<tableToken>/checkout` instead of opening the modal. `rtk npm run lint` shows no unused-variable errors.
**Commit:** `rtk git add -A && rtk git commit -m "feat(fe): route orders pay-all CTA to batch checkout"`

---

## Part B — Customer Registration

### Task B1 — Register endpoint constant + auth service function

**Files:** `src/constants/api-endpoints.ts`, `src/services/auth/auth.api.ts`

> **Contract (reconcile against `02-be-registration.md` + real BE `auth.controller.ts`/`auth.service.ts` before finalizing).** Expected: `POST /auth/register` body `{ username, password, fullName }` → same success shape as login: `{ accessToken, refreshToken, user }`. If 02 names fields differently (e.g. adds `phone` or returns no tokens), adjust `RegisterPayload`/return type here and the schema in B2 to match — do not guess.

In `api-endpoints.ts`, add to `API.AUTH`:

```ts
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    REFRESH: "/auth/refresh-token",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
  },
```

In `auth.api.ts`, reuse `LoginResponse` and add:

```ts
export interface RegisterPayload {
  username: string;
  password: string;
  fullName: string;
}

export const userRegister = (data: RegisterPayload): Promise<LoginResponse> => {
  return request.post(API.AUTH.REGISTER, data, { skipAuth: true } as never);
};
```

**Verify:** typecheck clean; `userRegister` exported (re-exported via `auth.index.ts` barrel already re-exporting `./auth.api`).
**Commit:** `rtk git add -A && rtk git commit -m "feat(fe): add register endpoint + auth api"`

---

### Task B2 — Register Zod schema

**File:** `src/schemas/auth.schema.ts`

Extend the existing schema file (keep `LoginSchema`). Add name + confirm-password with a match refine:

```ts
export const RegisterSchema = z
  .object({
    fullName: z.string().min(1, "Họ tên không được để trống"),
    username: z
      .string()
      .min(3, "Tên đăng nhập tối thiểu 3 ký tự"),
    password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu nhập lại không khớp",
  });

export type RegisterFormType = z.infer<typeof RegisterSchema>;
```

**Verify:** typecheck clean.
**Commit:** `rtk git add -A && rtk git commit -m "feat(fe): add register form schema"`

---

### Task B3 — `useRegister` hook (mirror `useLogin`)

**File:** `src/hooks/useRegister.ts`

Mirror `useLogin` exactly: build the form, call `userRegister`, persist tokens + user via `useAuthStore`, redirect to the role's default route, surface API errors on `root`. Strip `confirmPassword` before sending.

```ts
// src/hooks/useRegister.ts
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/auth.store";
import { userRegister } from "@/services/auth/auth.api";
import { useRouter } from "next/navigation";
import { getSafeRedirectUrl } from "@/utils/navigation";
import { type RegisterFormType, RegisterSchema } from "@/schemas/auth.schema";

interface UseRegisterReturn {
  form: UseFormReturn<RegisterFormType>;
  handleRegister: (data: RegisterFormType) => Promise<void>;
  isLoading: boolean;
}

export const useRegister = (): UseRegisterReturn => {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();

  const form = useForm<RegisterFormType>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      fullName: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleRegister = async (data: RegisterFormType) => {
    try {
      const res = await userRegister({
        fullName: data.fullName,
        username: data.username,
        password: data.password,
      });
      setTokens(res.accessToken, res.refreshToken);
      setUser(res.user);
      router.push(getSafeRedirectUrl(null, res.user.role));
    } catch (error: any) {
      const message = error?.message || "Đăng ký thất bại, vui lòng thử lại";
      form.setError("root", { message });
    }
  };

  return { form, handleRegister, isLoading: form.formState.isSubmitting };
};
```

> Confirm `getSafeRedirectUrl` in `src/utils/navigation.ts` accepts `(redirect: string | null, role)` and handles an unknown/customer role gracefully (login passes the same). If 02's register returns no tokens (email-verify flow), replace the persist+redirect with `router.push(ROUTES.LOGIN)` + a success toast instead.

**Verify:** typecheck clean.
**Commit:** `rtk git add -A && rtk git commit -m "feat(fe): add useRegister hook"`

---

### Task B4 — `RegisterForm` component (mirror `LoginForm`)

**File:** `src/app/(auth)/register/_components/RegisterForm.tsx`

Mirror `LoginForm.tsx` field markup (same input classes, `errors.root` banner, password show/hide toggle, submit button with `SpinnerIcon`). Add `fullName` + `confirmPassword` fields.

```tsx
// src/app/(auth)/register/_components/RegisterForm.tsx
"use client";
import { EyeIcon } from "@/components/shared/icons/EyeIcon";
import { EyeOffIcon } from "@/components/shared/icons/EyeOffIcon";
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { useRegister } from "@/hooks/useRegister";
import { useState } from "react";

const inputClass = (hasError: boolean) =>
  `w-full rounded-xl border px-4 py-2.5 text-sm
   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
   placeholder:text-gray-400 dark:placeholder:text-gray-500
   outline-none transition-colors
   focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20
   disabled:cursor-not-allowed disabled:opacity-50
   ${hasError ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : "border-gray-200 dark:border-gray-700"}`;

export default function RegisterForm() {
  const { form, handleRegister, isLoading } = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={handleSubmit(handleRegister)} noValidate className="space-y-4">
      {errors.root && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {errors.root.message}
        </div>
      )}

      {/* fullName */}
      <div className="space-y-1.5">
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Họ và tên
        </label>
        <input
          id="fullName"
          type="text"
          autoComplete="name"
          autoFocus
          placeholder="Nhập họ và tên"
          disabled={isLoading}
          {...register("fullName")}
          className={inputClass(!!errors.fullName)}
        />
        {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
      </div>

      {/* username */}
      <div className="space-y-1.5">
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Tên đăng nhập
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          placeholder="Nhập tên đăng nhập"
          disabled={isLoading}
          {...register("username")}
          className={inputClass(!!errors.username)}
        />
        {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
      </div>

      {/* password */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Mật khẩu
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Nhập mật khẩu"
            disabled={isLoading}
            {...register("password")}
            className={inputClass(!!errors.password)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>

      {/* confirmPassword */}
      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Nhập lại mật khẩu
        </label>
        <input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Nhập lại mật khẩu"
          disabled={isLoading}
          {...register("confirmPassword")}
          className={inputClass(!!errors.confirmPassword)}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 w-full rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-medium text-white
          hover:bg-brand-500 active:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2
          focus-visible:outline-brand-400 disabled:cursor-not-allowed disabled:opacity-60
          transition-colors flex items-center justify-center gap-2"
      >
        {isLoading && <SpinnerIcon className="size-4 animate-spin" />}
        {isLoading ? "Đang đăng ký" : "Đăng ký"}
      </button>
    </form>
  );
}
```

**Verify:** compiles; rendered in B5.
**Commit:** `rtk git add -A && rtk git commit -m "feat(fe): add RegisterForm component"`

---

### Task B5 — Register page + login↔register cross-links

**Files:** `src/app/(auth)/register/page.tsx`, `src/app/(auth)/login/page.tsx`

Register page reuses the login page's card shell (`(auth)/layout.tsx` is a passthrough). Uses `next/link` for the "already have an account" link.

```tsx
// src/app/(auth)/register/page.tsx
import Link from "next/link";
import { ROUTES } from "@/constants";
import RegisterForm from "./_components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 dark:bg-gray-950 px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 size-80 rounded-full bg-brand-100 opacity-60 dark:opacity-10" />
        <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-brand-200 opacity-40 dark:opacity-10" />
      </div>
      <div className="relative w-full max-w-sm">
        <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-xl shadow-brand-100/50 dark:shadow-none border border-gray-100 dark:border-gray-800 p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-brand-400 shadow-brand-400/30 text-3xl select-none">
              ☕
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Chalo Coffee</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tạo tài khoản</p>
          </div>
          <RegisterForm />
          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Đã có tài khoản?{" "}
            <Link href={ROUTES.LOGIN} className="font-medium text-brand-500 hover:text-brand-600">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

Then add the reciprocal link to `login/page.tsx` — insert after `<LoginForm />` inside its card (add `import Link from "next/link"` and `import { ROUTES } from "@/constants"` at top):

```tsx
          <LoginForm />
          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Chưa có tài khoản?{" "}
            <Link href={ROUTES.REGISTER} className="font-medium text-brand-500 hover:text-brand-600">
              Đăng ký
            </Link>
          </p>
```

**Verify (manual):** `rtk npm run dev`; visit `http://localhost:3000/register`. Expect the Chalo card with Họ tên / Tên đăng nhập / Mật khẩu / Nhập lại mật khẩu fields. Submitting mismatched passwords shows "Mật khẩu nhập lại không khớp" under confirm. With BE register live (per 02), a valid submit logs in and redirects to the role default route. The "Đã có tài khoản? Đăng nhập" link goes to `/login`; from `/login` the "Chưa có tài khoản? Đăng ký" link returns to `/register`. Confirm `ROUTES.REGISTER` (`/register`) matches the folder path.
**Commit:** `rtk git add -A && rtk git commit -m "feat(fe): add register page and auth cross-links"`

---

### Task B6 — Final lint + full manual smoke

**Files:** none (verification only)

**Verify:** run `rtk npm run lint` (clean) and, optionally, `rtk npm run build` to confirm the new App Router pages compile. Manual smoke: (A) checkout flow end-to-end on a real table token, (B) register → auto-login → redirect. Confirm no console errors and both new routes render inside their route groups.
**Commit:** `rtk git add -A && rtk git commit -m "chore(fe): lint + verify checkout & register flows"`
