# Customer Menu/Orders UI Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix a real "paid total" calculation bug on the customer orders page, delete dead/broken responsive grid code in the customer menu page, and replace a text-as-icon placeholder in the search bar with a real icon.

**Architecture:** Three independent, narrowly-scoped changes in the existing Next.js customer app (`chalo-fe`). No new files beyond one new Playwright e2e spec. No backend changes — the backend's public `/order/pay` endpoint already exists and is used as-is to set up the regression test.

**Tech Stack:** Next.js (App Router) + React + Tailwind CSS v4, Zustand (cart store), TanStack Query, Playwright for e2e (no unit test runner in this repo — verification for the bug fix goes through a new Playwright spec against the real backend, following the existing `e2e/customer-checkout.spec.ts` pattern).

## Global Constraints

- Backend runs at `http://localhost:8080/api`, frontend dev server at `http://localhost:3000` (from `playwright.config.ts`). Both must already be running before running e2e tests — this repo's Playwright config has no `webServer` block.
- Follow the existing e2e convention: hit the real backend directly via the Playwright `request` fixture for setup (no mocking), matching `e2e/customer-checkout.spec.ts`.
- Desktop/tablet layout for customer-facing pages is explicitly out of scope (confirmed with user: QR-at-table ordering is mobile-only). Do not add or preserve desktop-specific responsive styling in these files.
- Do not touch `ProductCard.tsx`'s existing `sm:` spacing/typography variants — out of scope, not part of the verified findings.
- Vietnamese UI copy in this codebase has an existing typo, `dơn` instead of `đơn`, in the "Đã thanh toán" line (`orders/page.tsx`). Do not fix unrelated copy — not part of this plan's scope.

---

### Task 1: Fix the "Đã thanh toán" paid-total bug on the orders page

**Files:**
- Modify: `src/app/(customer)/menu/[tableToken]/orders/page.tsx:154`
- Create: `e2e/customer-orders-paid-summary.spec.ts`

**Interfaces:**
- Consumes: `OrderDto` from `src/services/order/order.types.ts` (fields used: `id`, `totalAmount`, `paidStatus`). Backend endpoints: `POST /order/create` (public, from `e2e/customer-checkout.spec.ts` pattern), `POST /order/pay` (public, body `{ orderId: string }`), `GET /order/by-token/:token` (public, returns `OrderDto[]`).
- Produces: nothing consumed by later tasks — this task is self-contained.

- [ ] **Step 1: Write the failing e2e test**

Create `e2e/customer-orders-paid-summary.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

// Regression test for a bug where the orders page's "Đã thanh toán" summary
// line summed ALL orders' totalAmount instead of only paid ones (it filtered
// on `o.status`, which is always truthy, instead of `o.paidStatus`).
const BE = "http://localhost:8080/api";

test("orders page paid-total only counts orders with paidStatus true", async ({
  page,
  request,
}) => {
  const login = await request.post(`${BE}/auth/login`, {
    data: { username: "admin", password: "admin" },
  });
  const adminToken = (await login.json()).data.accessToken;
  const auth = { Authorization: `Bearer ${adminToken}` };

  const tablesRes = await request.get(`${BE}/table/list`, { headers: auth });
  const tableToken: string = (await tablesRes.json()).data[0].qrToken;

  const prodRes = await request.get(`${BE}/menu/product/simple-list`, {
    headers: auth,
  });
  const productId: string = (await prodRes.json()).data[0].id;

  // Create two fresh orders on the table: one we'll pay, one we'll leave open.
  const paidOrderRes = await request.post(`${BE}/order/create`, {
    data: { tableToken, items: [{ productId, quantity: 2 }] },
  });
  expect(paidOrderRes.status()).toBe(201);
  const paidOrder = (await paidOrderRes.json()).data;

  const unpaidOrderRes = await request.post(`${BE}/order/create`, {
    data: { tableToken, items: [{ productId, quantity: 1 }] },
  });
  expect(unpaidOrderRes.status()).toBe(201);

  // Mark only the first order as paid (public endpoint, no auth needed).
  const payRes = await request.post(`${BE}/order/pay`, {
    data: { orderId: paidOrder.id },
  });
  expect(payRes.ok()).toBeTruthy();

  // Ground truth: sum totalAmount of every order on this table with
  // paidStatus true, using the same public endpoint the page reads from.
  const afterRes = await request.get(`${BE}/order/by-token/${tableToken}`);
  const allOrders = (await afterRes.json()).data;
  const expectedPaidTotal = allOrders
    .filter((o: { paidStatus: boolean }) => o.paidStatus)
    .reduce(
      (sum: number, o: { totalAmount: number }) => sum + o.totalAmount,
      0,
    );
  const grandTotal = allOrders.reduce(
    (sum: number, o: { totalAmount: number }) => sum + o.totalAmount,
    0,
  );
  // Sanity check the test setup actually creates a paid/unpaid split —
  // otherwise this test can't distinguish correct from buggy behavior.
  expect(expectedPaidTotal).toBeLessThan(grandTotal);

  await page.goto(`/menu/${tableToken}/orders`);
  const paidRow = page.locator("div.flex.justify-between.text-sm", {
    hasText: "Đã thanh toán",
  });
  await expect(paidRow).toBeVisible({ timeout: 15_000 });
  const amountText = await paidRow.locator("span.font-medium").textContent();
  const paidDigits = (amountText ?? "").replace(/\D/g, "");
  expect(Number(paidDigits)).toBe(expectedPaidTotal);
});
```

- [ ] **Step 2: Run the test to verify it fails on the current bug**

Run: `npm run test:e2e -- customer-orders-paid-summary`
Expected: FAIL — the displayed amount equals `grandTotal` (all orders), not `expectedPaidTotal` (only the paid one), because the current code filters on `o.status` instead of `o.paidStatus`.

- [ ] **Step 3: Fix the bug**

In `src/app/(customer)/menu/[tableToken]/orders/page.tsx`, find (around line 154):

```tsx
                      <span className="font-medium text-green-600 dark:text-green-400">
                        -{" "}
                        {orders
                          .filter((o) => o.status)
                          .reduce((s, o) => s + o.totalAmount, 0)
                          .toLocaleString("vi-VN")}
                        đ
                      </span>
```

Change the filter predicate:

```tsx
                      <span className="font-medium text-green-600 dark:text-green-400">
                        -{" "}
                        {orders
                          .filter((o) => o.paidStatus)
                          .reduce((s, o) => s + o.totalAmount, 0)
                          .toLocaleString("vi-VN")}
                        đ
                      </span>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test:e2e -- customer-orders-paid-summary`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/\(customer\)/menu/\[tableToken\]/orders/page.tsx e2e/customer-orders-paid-summary.spec.ts
git commit -m "fix: orders page summed all orders instead of only paid ones"
```

---

### Task 2: Remove the broken desktop-width responsive grid in the customer menu

**Files:**
- Modify: `src/app/(customer)/menu/[tableToken]/_components/CustomerMenuClient.tsx:98,187,195,213`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing consumed by later tasks.

**Context:** `(customer)/layout.tsx` wraps every customer route in `max-w-md` (448px). `CustomerMenuClient.tsx` separately sets `max-w-6xl` and `sm:grid-cols-2 xl:grid-cols-3`, which — since Tailwind's responsive variants key off viewport width, not container width — DO activate at wide viewports, producing a 3-column grid of ~120px-wide cards squeezed inside the 448px container (verified via `page.evaluate` at a 1440px viewport). Desktop is out of scope for this app, so this code only ever produces a broken layout for the one case it targets. Delete it; the single-column layout that already renders in practice is unaffected.

- [ ] **Step 1: Remove `max-w-6xl` and responsive padding from the header wrapper**

In `CustomerMenuClient.tsx`, find (line 98):

```tsx
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
```

Replace with:

```tsx
          <div className="mx-auto flex flex-col gap-3 px-4 py-3">
```

- [ ] **Step 2: Remove `max-w-6xl` and responsive padding from `<main>`**

Find (line 187):

```tsx
        <main className="mx-auto max-w-6xl px-4 pb-28 pt-4 sm:px-6 lg:px-8">
```

Replace with:

```tsx
        <main className="mx-auto px-4 pb-28 pt-4">
```

- [ ] **Step 3: Remove the multi-column grid variants from both product grids**

Find (line 195, inside the filtered/search results branch):

```tsx
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
```

Replace with:

```tsx
                <div className="grid gap-3">
```

Find (line 213, inside the grouped-by-category branch):

```tsx
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
```

Replace with:

```tsx
                  <div className="grid gap-3">
```

- [ ] **Step 4: Typecheck and run the existing customer e2e spec to confirm no regressions**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run test:e2e -- customer-checkout`
Expected: PASS (this spec drives the menu → cart → checkout flow end to end; it doesn't assert on grid column count, so it confirms the page still renders and functions, not the specific style change).

- [ ] **Step 5: Commit**

```bash
git add src/app/\(customer\)/menu/\[tableToken\]/_components/CustomerMenuClient.tsx
git commit -m "refactor: drop unreachable-in-practice desktop grid from customer menu"
```

---

### Task 3: Replace the text-as-icon search placeholder with a real search icon

**Files:**
- Modify: `src/app/(customer)/menu/[tableToken]/_components/CustomerMenuClient.tsx:140-149`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing consumed by later tasks.

**Context:** The search input renders the literal text `"Tìm"` positioned like an icon instead of an actual icon:

```tsx
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                  Tìm
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm món..."
                  className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-12 pr-4 text-sm text-gray-950 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-50 dark:placeholder:text-gray-500"
                />
              </div>
```

The file already draws icons as inline SVG elsewhere (the cart button, further down in the same component) with no icon library dependency — match that style.

- [ ] **Step 1: Replace the text span with an inline SVG search icon**

Replace the block above with:

```tsx
              <div className="relative">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm món..."
                  className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-950 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-50 dark:placeholder:text-gray-500"
                />
              </div>
```

(Note `pl-12` → `pl-10`: the old value made room for the word "Tìm"; the new compact 16px icon needs less left padding.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Visually verify with a screenshot**

Run (dev server must be running at `localhost:3000`):

```bash
npx playwright screenshot --viewport-size=390,844 "http://localhost:3000/menu/<any-valid-table-token>" /tmp/search-icon-check.png
```

Open the screenshot and confirm the search bar shows a magnifying-glass icon (not text) at its left edge, vertically centered, with the placeholder text starting cleanly to its right with no overlap.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(customer\)/menu/\[tableToken\]/_components/CustomerMenuClient.tsx
git commit -m "polish: replace text-as-icon search placeholder with an svg icon"
```
