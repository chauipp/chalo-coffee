# Admin Product Form Mobile Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the admin product create/edit form clear and comfortable at a 390px phone width while preserving desktop layout, validation, uploads, mutations, and draft recovery.

**Architecture:** Keep `ProductForm` as the single owner of form state and persistence, and reorganize only its JSX into five responsive section wrappers. Use the existing modal bottom-sheet capability for mobile and make its large desktop size map explicit. Add Playwright assertions for section order, no horizontal overflow, reachable actions, and draft restoration.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, react-hook-form, Playwright, Node test runner.

---

## File map

- Modify: `chalo-fe/e2e/admin-mobile.spec.ts` — red/green mobile regression for grouped product editor.
- Modify: `chalo-fe/src/components/shared/ui/Modal.tsx` — preserve the requested `sm`/`md`/`lg` width when `presentation="bottom-sheet"` is used.
- Modify: `chalo-fe/src/app/(admin)/admin/menu/products/page.tsx` — opt create/edit dialogs into the responsive bottom-sheet presentation.
- Modify: `chalo-fe/src/app/(admin)/admin/menu/products/_components/ProductForm.tsx` — sectioned mobile layout, image control grouping, and sticky actions; no hook or mutation changes.

## Task 1: Add the failing mobile editor regression

**Files:**

- Modify: `chalo-fe/e2e/admin-mobile.spec.ts`

- [ ] **Step 1: Add a test for the approved section layout**

Append this test after the existing product restoration test. It uses the existing login helper and the product-card title action:

```ts
test("mobile product editor groups fields and keeps actions reachable", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/menu/products");

  await page
    .getByTestId("product-mobile-card")
    .first()
    .getByRole("button", { name: /Mở chỉnh sửa/ })
    .click();

  const dialog = page.getByRole("dialog", { name: "Chỉnh sửa sản phẩm" });
  await expect(dialog).toBeVisible();

  const sections = dialog.locator("[data-testid^='product-edit-section-']");
  await expect(sections).toHaveCount(5);
  await expect(sections.nth(0)).toHaveAttribute("data-testid", "product-edit-section-info");
  await expect(sections.nth(1)).toHaveAttribute("data-testid", "product-edit-section-operations");
  await expect(sections.nth(2)).toHaveAttribute("data-testid", "product-edit-section-description");
  await expect(sections.nth(3)).toHaveAttribute("data-testid", "product-edit-section-image");
  await expect(sections.nth(4)).toHaveAttribute("data-testid", "product-edit-section-visibility");

  await expect(dialog.getByRole("heading", { name: "Thông tin món" })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Giá & vận hành" })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Mô tả" })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Hình ảnh" })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Hiển thị" })).toBeVisible();

  const hasHorizontalOverflow = await dialog.evaluate(
    (node) => node.scrollWidth > node.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);

  const actions = dialog.getByTestId("product-edit-actions");
  await expect(actions).toBeVisible();
  const actionsBox = await actions.boundingBox();
  const dialogBox = await dialog.boundingBox();
  expect(actionsBox).not.toBeNull();
  expect(dialogBox).not.toBeNull();
  expect(actionsBox!.y + actionsBox!.height).toBeLessThanOrEqual(
    dialogBox!.y + dialogBox!.height,
  );

  const nameInput = dialog.locator('input[name="name"]');
  const draftName = `${await nameInput.inputValue()} grouped draft`;
  await nameInput.fill(draftName);
  await page.waitForTimeout(350);
  await page.reload();

  const restoredDialog = page.getByRole("dialog", { name: "Chỉnh sửa sản phẩm" });
  await expect(restoredDialog).toBeVisible({ timeout: 15_000 });
  await expect(restoredDialog.locator('input[name="name"]')).toHaveValue(draftName);

  await restoredDialog.getByRole("button", { name: "Hủy" }).click();
  await expect(restoredDialog).toBeHidden();
});
```

- [ ] **Step 2: Run the new test and confirm it is red**

Run from `chalo-fe` while the local app is available at port 3100:

```powershell
$env:PLAYWRIGHT_BASE_URL = "http://localhost:3100"
pnpm test:e2e e2e/admin-mobile.spec.ts --project=admin-mobile --grep "groups fields"
```

Expected failure: the existing flat form has no `product-edit-section-*` nodes or section headings.

- [ ] **Step 3: Commit the red regression**

```powershell
git add chalo-fe/e2e/admin-mobile.spec.ts
git commit -m "test: specify grouped mobile product editor"
```

## Task 2: Make the modal presentation preserve desktop sizing

**Files:**

- Modify: `chalo-fe/src/components/shared/ui/Modal.tsx`
- Modify: `chalo-fe/src/app/(admin)/admin/menu/products/page.tsx`

- [ ] **Step 1: Add an explicit responsive size map for bottom sheets**

Immediately after the existing `sizeClass`, add:

```ts
const sheetSizeClass = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
} as const;
```

Replace the bottom-sheet branch of the panel class with a static Tailwind class map so `size="lg"` remains wide on desktop:

```tsx
isBottomSheet
  ? `max-w-none rounded-t-3xl sm:rounded-2xl ${sheetSizeClass[size]}`
  : `${sizeClass[size]} rounded-2xl`
```

Keep the existing dialog keyboard, focus, scroll-lock, portal, and backdrop behavior unchanged.

- [ ] **Step 2: Use the bottom-sheet presentation for product create/edit**

Add `presentation="bottom-sheet"` to both product page modals without changing their titles, `size="lg"`, callbacks, or `ProductForm` props:

```tsx
<Modal
  onClose={() => setCreateOpen(false)}
  open={createOpen}
  title="Thêm sản phẩm mới"
  size="lg"
  presentation="bottom-sheet"
>
```

Apply the same prop to the edit modal.

- [ ] **Step 3: Run typecheck and the focused red test**

```powershell
pnpm exec tsc --noEmit
$env:PLAYWRIGHT_BASE_URL = "http://localhost:3100"
pnpm test:e2e e2e/admin-mobile.spec.ts --project=admin-mobile --grep "groups fields"
```

Expected: TypeScript passes; the E2E test still fails on missing grouped sections, proving the test is exercising the form rather than the modal shell.

- [ ] **Step 4: Commit modal wiring**

```powershell
git add chalo-fe/src/components/shared/ui/Modal.tsx chalo-fe/src/app/(admin)/admin/menu/products/page.tsx
git commit -m "fix: present product editor as responsive sheet"
```

## Task 3: Rebuild `ProductForm` as grouped, mobile-first sections

**Files:**

- Modify: `chalo-fe/src/app/(admin)/admin/menu/products/_components/ProductForm.tsx`

- [ ] **Step 1: Preserve all stateful code above the return**

Do not change `serverDefaults`, `useProductDraft`, `useForm`, `useWatch`, `saveDraft`, `handleImageUpload`, `imageUrl`, or submit/cancel callbacks. Only replace the returned JSX and add presentational constants/classes.

- [ ] **Step 2: Add the section shell and information fields**

Use this wrapper pattern (repeat it for the five sections):

```tsx
<section
  data-testid="product-edit-section-info"
  className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3 dark:border-gray-800 dark:bg-gray-950/40 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0"
>
  <div className="mb-3 flex items-center gap-2">
    <span aria-hidden="true" className="size-2 rounded-full bg-brand-400" />
    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      Thông tin món
    </h3>
  </div>
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    {/* name spans both columns; category and status share the next row */}
  </div>
</section>
```

Keep `FormField`, `Input`, `Select`, `register`, and error props exactly as they are. The name wrapper uses `sm:col-span-2`; category and status remain separate fields. Add `data-testid="product-edit-section-info"` only to the section, not to individual fields.

- [ ] **Step 3: Add operations, description, image, and visibility sections**

Use these exact section test IDs and order:

```text
product-edit-section-info
product-edit-section-operations
product-edit-section-description
product-edit-section-image
product-edit-section-visibility
```

Operations contains price and preparation time in `grid grid-cols-1 gap-4 sm:grid-cols-2`. Description uses a `min-h-24` textarea and keeps the existing hint. Image uses a preview placeholder/thumbnail beside the URL input on `sm` and stacks naturally on narrow screens; the upload label is a full-width, 44px secondary control with visible text “Tải ảnh từ thiết bị” and the existing spinner/file input. Visibility is a `min-h-11` row with explanatory copy on the left and the existing `Toggle` on the right.

The image control must keep the existing upload behavior:

```tsx
<label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-3 text-sm font-medium text-gray-600 transition-colors hover:border-brand-400 hover:bg-brand-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
  {isUploading ? <SpinnerIcon className="size-4 animate-spin" /> : "Tải ảnh từ thiết bị"}
  <input type="file" accept="image/*" onChange={handleImageUpload} className="sr-only" />
</label>
```

- [ ] **Step 4: Add the sticky action footer**

Replace the existing action wrapper with:

```tsx
<div
  data-testid="product-edit-actions"
  className="sticky bottom-0 -mx-4 border-t border-gray-200 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0"
>
  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    <button type="button" onClick={onCancel} disabled={isLoading} className="min-h-11 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
      Hủy
    </button>
    <button type="submit" disabled={isLoading} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50">
      {isLoading && <SpinnerIcon className="size-4 animate-spin" />}
      {defaultValue ? "Cập nhật" : "Thêm mới"}
    </button>
  </div>
</div>
```

The form root remains `className="space-y-4 sm:space-y-5"`; do not add a second scroll container inside the form.

- [ ] **Step 5: Run the focused test and confirm green**

```powershell
$env:PLAYWRIGHT_BASE_URL = "http://localhost:3100"
pnpm test:e2e e2e/admin-mobile.spec.ts --project=admin-mobile --grep "groups fields"
```

Expected: the grouped-section test passes, including the 390px no-overflow and draft restoration assertions.

- [ ] **Step 6: Commit the form redesign**

```powershell
git add chalo-fe/src/app/(admin)/admin/menu/products/_components/ProductForm.tsx
git commit -m "feat: group product editor fields on mobile"
```

## Task 4: Full verification and visual inspection

**Files:**

- Verify: all files above; no additional source changes expected.

- [ ] **Step 1: Run the complete frontend checks**

From `chalo-fe`:

```powershell
pnpm test:unit
pnpm exec tsc --noEmit
pnpm build
$env:PLAYWRIGHT_BASE_URL = "http://localhost:3100"
pnpm test:e2e e2e/admin-mobile.spec.ts --project=admin-mobile
```

Expected: all unit tests pass, TypeScript exits 0, production build exits 0, and every targeted mobile E2E test passes.

- [ ] **Step 2: Run the desktop smoke check**

```powershell
$env:PLAYWRIGHT_BASE_URL = "http://localhost:3100"
pnpm test:e2e --project=chromium
```

Expected: desktop suites pass and the product editor remains usable with the existing large dialog width.

- [ ] **Step 3: Inspect the real 390px editor**

At `http://localhost:3100/admin/menu/products`, open a product and verify:

```text
The five section labels are visible in the approved order.
Name is full width; category/status and price/preparation time are paired.
The image preview and upload controls read as one group.
The sticky footer stays above the modal edge and both buttons have comfortable touch targets.
Typing a name, reloading, and returning to the editor restores the draft.
```

- [ ] **Step 4: Confirm Git hygiene**

```powershell
git status --short
```

Only the intentionally local `.env`, mock service worker, and untracked process documentation may remain; do not stage them.

## Self-review

- Spec coverage: section grouping, responsive behavior, action reachability, image grouping, state preservation, accessibility, desktop compatibility, and all required verification commands are represented above.
- Placeholder scan: no incomplete markers or vague implementation steps are used.
- Type consistency: section test IDs, modal `presentation`/`size` props, and existing `ProductForm` callbacks match the current source signatures.
