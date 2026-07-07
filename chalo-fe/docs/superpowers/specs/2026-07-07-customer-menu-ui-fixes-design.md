# Customer menu/cart/orders UI fixes — design

## Context

Requested: test the customer menu page (`/menu/[tableToken]`) with Playwright and
improve the UI. Investigation (screenshots + DOM inspection at mobile 390px and
desktop 1440px viewports) surfaced concrete, verified issues rather than
subjective polish. Scope confirmed with user:

- Customer-facing pages are mobile-only by design (QR-at-table ordering). No
  desktop layout work needed.
- Full customer flow in scope: menu, cart, checkout, orders — not just menu.

## Findings

### 1. Correctness bug — wrong "paid" total on orders page

`src/app/(customer)/menu/[tableToken]/orders/page.tsx:154`

```ts
.filter((o) => o.status)          // truthy for every order — bug
.reduce((s, o) => s + o.totalAmount, 0)
```

Should filter by `o.paidStatus`, matching the count above it
(`orders.filter((o) => o.paidStatus).length`). Verified via screenshot: with 7
orders (1 paid, 6 unpaid), the "Đã thanh toán" line showed 1.366.000đ (the
grand total of all 7 orders) instead of 262.000đ (the actual paid order's
total). Customers would see incorrect payment summaries.

**Fix:** change filter predicate to `o.paidStatus`.

### 2. Dead responsive code in customer menu grid

`(customer)/layout.tsx` wraps every customer route in `max-w-md` (448px),
applied regardless of viewport. `CustomerMenuClient.tsx` independently sets
`max-w-6xl` on its header and main, and its product grid uses
`sm:grid-cols-2 xl:grid-cols-3`. Tailwind's responsive variants key off
*viewport* width, not container width, so at a 1440px viewport these variants
do trigger — confirmed via `page.evaluate`: at 1440px the grid's computed
`grid-template-columns` is `120px 120px 120px` inside a 384px-wide container
(the `max-w-md` ancestor leaves only that much room after padding). The
result isn't "no effect", it's a visibly broken 3-column grid of 120px-wide
cards squeezed into a mobile-width column.

Since desktop is explicitly out of scope, this is code that actively produces
a broken layout for the one audience (wide viewports) it targets, implying a
wider design than what actually ships.

**Fix:** in `CustomerMenuClient.tsx`, drop `max-w-6xl` and the `sm:`/`xl:`
breakpoint variants on the two grids and the header wrapper; keep the
single-column layout that already renders in practice. No visual change for
users — this is a code-clarity cleanup, not a behavior change.

### 3. Search input polish

The search bar renders a plain text string ("Tìm") in place of an icon,
positioned absolutely like an icon:

```tsx
<span className="pointer-events-none absolute ...">Tìm</span>
<input placeholder="Tìm món..." ... />
```

Reads as unfinished. The file already draws other icons (cart button) as
inline SVG with no icon library dependency.

**Fix:** replace the text span with an inline SVG magnifying-glass icon,
matching the existing stroke-based icon style used for the cart button in the
same file.

## Out of scope

- The `~432 phút` estimated wait time on the cart page is implausible but is a
  backend/mock data value, not a frontend defect — not touched.
- No other correctness or layout bugs found on cart/checkout/orders after
  visual + DOM inspection at mobile viewport with populated cart and 7 mock
  orders.

## Testing

Each fix gets a runnable check per ponytail's rule (non-trivial logic needs a
check):

- Fix 1: extend/add a unit test on the orders page's paid-total calculation
  (or a small pure-function extraction) proving it sums only `paidStatus`
  orders — reproduces the bug if reverted.
- Fix 2: existing e2e (`e2e/customer-checkout.spec.ts`, which already drives
  the orders/checkout flow) should still pass; no new behavior to test since
  output is unchanged, only unreachable code removed.
- Fix 3: visual-only change; no meaningful assertion beyond existing e2e
  rendering the page without errors.
