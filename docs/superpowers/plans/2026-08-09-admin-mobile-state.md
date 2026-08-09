# Admin Mobile UI and State Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with verification checkpoints.

**Goal:** Make the admin UI mobile-first with a bottom tab bar and restore the exact admin page, filters, open product editor, and unfinished product edits after a mobile browser interruption.

**Architecture:** Add small browser-safe persistence utilities under `src/utils`, a client `AdminStateRestorer` mounted by the admin layout, and a `MobileAdminNav` rendered only below the desktop breakpoint. Keep product editing in the existing modal and make its state serializable/draft-aware rather than introducing a new route hierarchy.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS v4, Zustand auth store, React Hook Form, Node test runner, Playwright.

---

### Task 1: Add tested persistence primitives

**Files:**
- Create: `chalo-fe/src/utils/admin-persistence.ts`
- Create: `chalo-fe/src/utils/admin-persistence.test.mts`
- Modify: `chalo-fe/package.json` (add `test:unit` script)

- [ ] **Step 1: Write failing tests** for route serialization, malformed storage cleanup, user-scoped product drafts, and draft expiry using an in-memory `Storage` shim.

```ts
test("round-trips a route with query string", () => {
  saveAdminRoute(storage, "user-1", "/admin/menu/products", "?categoryId=coffee");
  assert.deepEqual(readAdminRoute(storage, "user-1"), {
    pathname: "/admin/menu/products",
    search: "?categoryId=coffee",
  });
});

test("invalid JSON is removed and ignored", () => {
  storage.setItem(adminRouteKey("user-1"), "{");
  assert.equal(readAdminRoute(storage, "user-1"), null);
  assert.equal(storage.getItem(adminRouteKey("user-1")), null);
});

test("product draft is isolated by user and expires", () => {
  saveProductDraft(storage, "user-1", "p-1", { name: "Latte" }, 1000);
  assert.deepEqual(readProductDraft(storage, "user-1", "p-1", 1000), { name: "Latte" });
  assert.equal(readProductDraft(storage, "user-2", "p-1", 1000), null);
  assert.equal(readProductDraft(storage, "user-1", "p-1", 1000 + DRAFT_TTL_MS + 1), null);
});
```

- [ ] **Step 2: Run the focused test and confirm RED.**

Run: `node --test --experimental-strip-types src/utils/admin-persistence.test.mts`

Expected: FAIL because the persistence functions do not exist.

- [ ] **Step 3: Implement the minimal utility API.** Export `adminRouteKey`, `productDraftKey`, `saveAdminRoute`, `readAdminRoute`, `clearAdminRoute`, `saveProductDraft`, `readProductDraft`, `clearProductDraft`, and `DRAFT_TTL_MS`. Every read/write catches storage errors, validates object shape, and removes malformed/expired values.

- [ ] **Step 4: Run the focused test and confirm GREEN.**

Run: `node --test --experimental-strip-types src/utils/admin-persistence.test.mts`

Expected: PASS with four assertions.

- [ ] **Step 5: Commit.**

```bash
git add chalo-fe/src/utils/admin-persistence.ts chalo-fe/src/utils/admin-persistence.test.mts chalo-fe/package.json
git commit -m "feat: add admin state persistence utilities"
```

### Task 2: Build responsive admin navigation and route restoration

**Files:**
- Create: `chalo-fe/src/app/(admin)/_components/MobileAdminNav.tsx`
- Create: `chalo-fe/src/app/(admin)/_components/AdminStateRestorer.tsx`
- Modify: `chalo-fe/src/app/(admin)/layout.tsx`
- Modify: `chalo-fe/src/components/shared/Sidebar.tsx`
- Modify: `chalo-fe/src/app/(admin)/_components/sidebar.config.ts`

- [ ] **Step 1: Add a failing component-level contract test** in `chalo-fe/src/app/(admin)/_components/admin-navigation.test.mts` for the pure item-selection helper (menu routes active for categories/products) and restoration precedence (explicit route is never replaced).

- [ ] **Step 2: Run the test and confirm RED.**

Run: `node --test --experimental-strip-types "src/app/(admin)/_components/admin-navigation.test.mts"`

Expected: FAIL because the helpers are not exported.

- [ ] **Step 3: Implement navigation.** Add `getActiveAdminNavHref(pathname, items)` and use it in both desktop and mobile nav. `MobileAdminNav` renders five compact links with icons, labels, `aria-current`, `pb-[env(safe-area-inset-bottom)]`, and a `min-h-16` touch target. In the shell, render desktop sidebar in `hidden md:flex`, mobile header/nav in `md:hidden`, and add `pb-20 md:pb-0` to main content.

- [ ] **Step 4: Implement `AdminStateRestorer`.** Read the hydrated auth user, save pathname/search after navigation, and on the first `/admin` mount only call `router.replace(saved.pathname + saved.search)` when the current path is exactly `/admin`. Never replace an explicit deep link. Subscribe to logout to clear the route key. Persist sidebar collapse with a guarded `localStorage` read/write and default to expanded.

- [ ] **Step 5: Run focused tests and confirm GREEN.**

Run: `node --test --experimental-strip-types "src/app/(admin)/_components/admin-navigation.test.mts"`

Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add "chalo-fe/src/app/(admin)" chalo-fe/src/components/shared/Sidebar.tsx
git commit -m "feat: add mobile admin bottom navigation"
```

### Task 3: Persist product filters, active editor, and drafts

**Files:**
- Create: `chalo-fe/src/hooks/useProductDraft.ts`
- Modify: `chalo-fe/src/app/(admin)/admin/menu/products/page.tsx`
- Modify: `chalo-fe/src/app/(admin)/admin/menu/products/_components/ProductForm.tsx`
- Create: `chalo-fe/src/hooks/useProductDraft.test.mts`

- [ ] **Step 1: Write failing hook-logic tests** for merging server defaults with a valid draft and clearing on cancel/submit. Keep the tested logic as pure exported helpers so it runs in Node without a DOM.

```ts
test("draft values override server defaults", () => {
  assert.deepEqual(mergeProductDraft({ name: "Latte", price: 20000 }, { name: "Latte sua", price: 22000 }), {
    name: "Latte sua",
    price: 22000,
  });
});
```

- [ ] **Step 2: Run the focused test and confirm RED.**

Run: `node --test --experimental-strip-types src/hooks/useProductDraft.test.mts`

Expected: FAIL because `mergeProductDraft` is missing.

- [ ] **Step 3: Implement draft hook/helpers.** `useProductDraft(userId, productId, defaults)` returns `defaultValues`, `saveDraft`, and `clearDraft`; it debounces writes by 300ms and ignores drafts older than `DRAFT_TTL_MS`. Persist only JSON form values, never `File` objects.

- [ ] **Step 4: Wire the products page.** Restore `name`, `status`, and `categoryId` from a user-scoped filter key before constructing `initialFilter`. Persist filter changes and reset. Persist `{ target, mode }` for an edit target; on mount, restore the snapshot and show the edit modal after hydration. Clear target/draft on cancel and after successful update. Keep the create modal behavior unchanged except for mobile sizing.

- [ ] **Step 5: Make product names open the editor.** Replace the plain `<p>` name with a `<button type="button">` using the existing edit styling and `onClick={() => setEditTarget(row)}`; retain category text below it.

- [ ] **Step 6: Make `ProductForm` draft-aware and mobile-friendly.** Use `useProductDraft`, `watch`/`useEffect` to save values, merge draft over `defaultValue`, switch the field grid to `grid-cols-1 sm:grid-cols-2`, stack image controls and footer buttons on narrow screens, and clear the draft from the parent on cancel/submit completion.

- [ ] **Step 7: Run focused tests and confirm GREEN.**

Run: `node --test --experimental-strip-types src/hooks/useProductDraft.test.mts`

Expected: PASS.

- [ ] **Step 8: Commit.**

```bash
git add "chalo-fe/src/app/(admin)/admin/menu/products" chalo-fe/src/hooks/useProductDraft.ts chalo-fe/src/hooks/useProductDraft.test.mts
git commit -m "feat: restore product edit drafts on mobile"
```

### Task 4: Apply mobile layout polish across admin screens

**Files:**
- Modify: `chalo-fe/src/app/(admin)/admin/dashboard/page.tsx`
- Modify: `chalo-fe/src/app/(admin)/admin/menu/layout.tsx`
- Modify: `chalo-fe/src/components/shared/ui/DataTable.tsx`
- Modify: admin list pages under `chalo-fe/src/app/(admin)/admin/` that use fixed `p-6` or non-wrapping action rows.

- [ ] **Step 1: Update responsive spacing and controls.** Use `p-4 sm:p-6`, stack page headers/actions on small screens, make tabs horizontally scrollable, and add `pb-20 md:pb-0` only at the shell to avoid duplicate offsets.

- [ ] **Step 2: Improve dense table behavior.** Give the table wrapper `-mx-4 overflow-x-auto sm:mx-0` on mobile, preserve a readable minimum width, keep headers readable, and make action buttons at least 44px high.

- [ ] **Step 3: Run lint and type/build checks.**

Run: `pnpm lint` and `pnpm build` from `chalo-fe`.

Expected: exit code 0 with no lint errors and a successful Next build.

- [ ] **Step 4: Commit.**

```bash
git add chalo-fe/src/app/(admin) chalo-fe/src/components/shared/ui/DataTable.tsx
git commit -m "feat: polish admin screens for mobile"
```

### Task 5: Verify restoration and mobile affordances end to end

**Files:**
- Create: `chalo-fe/e2e/admin-mobile.spec.ts`
- Modify: `chalo-fe/playwright.config.ts` only if the existing config does not expose a mobile project.

- [ ] **Step 1: Add Playwright scenarios** for a mobile viewport: bottom nav visible, desktop sidebar hidden, product name opens edit modal, reload on `/admin/menu/products` retains filters, and a typed product edit value remains after reload while the modal is open.

- [ ] **Step 2: Run the focused Playwright suite.**

Run: `pnpm test:e2e e2e/admin-mobile.spec.ts` from `chalo-fe`.

Expected: all scenarios pass; if the local API/auth fixture is unavailable, record the exact environment blocker rather than weakening assertions.

- [ ] **Step 3: Run the complete verification set.**

Run: `node --test --experimental-strip-types src/utils/admin-persistence.test.mts src/hooks/useProductDraft.test.mts "src/app/(admin)/_components/admin-navigation.test.mts"`, `pnpm lint`, and `pnpm build`.

- [ ] **Step 4: Commit verification coverage.**

```bash
git add chalo-fe/e2e/admin-mobile.spec.ts chalo-fe/playwright.config.ts
git commit -m "test: cover admin mobile restoration"
```
