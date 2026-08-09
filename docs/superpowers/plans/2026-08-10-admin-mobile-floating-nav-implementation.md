# Floating Mobile Admin Nav Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Làm thanh điều hướng admin trên mobile dạng floating, bo góc, chia đều 5 mục và không còn khoảng trống lệch phải.

**Architecture:** Giữ nguyên `MobileAdminNav` và toàn bộ logic active route/bottom-sheet. Chỉ thay đổi lớp layout Tailwind, thêm test geometry qua `data-testid` để khóa hành vi thị giác quan trọng.

**Tech Stack:** Next.js, React, Tailwind CSS, Playwright, Node test runner, TypeScript.

---

### Task 1: Khóa hành vi layout bằng regression test

**Files:**
- Modify: `chalo-fe/e2e/admin-mobile.spec.ts:206-226`
- Test: `chalo-fe/e2e/admin-mobile.spec.ts`

- [ ] **Step 1: Viết test đỏ cho nav floating và chia đều**

Trong test `mobile tab labels do not clip at phone width`, sau khi đăng nhập và điều hướng tới trang admin, thêm:

```ts
  const mobileNav = page.getByTestId("admin-mobile-nav");
  await expect(mobileNav).toBeVisible();
  await expect(mobileNav).toHaveCSS("border-top-left-radius", "16px");

  const navItems = mobileNav
    .getByTestId("admin-mobile-nav-items")
    .locator(":scope > a, :scope > button");
  await expect(navItems).toHaveCount(5);

  const navBox = await mobileNav.boundingBox();
  const firstItemBox = await navItems.first().boundingBox();
  const lastItemBox = await navItems.last().boundingBox();
  expect(navBox).not.toBeNull();
  expect(firstItemBox).not.toBeNull();
  expect(lastItemBox).not.toBeNull();

  const leftInset = firstItemBox!.x - navBox!.x;
  const rightInset =
    navBox!.x + navBox!.width - (lastItemBox!.x + lastItemBox!.width);
  expect(Math.abs(leftInset - rightInset)).toBeLessThanOrEqual(2);
```

- [ ] **Step 2: Chạy test để xác nhận hiện trạng thất bại**

Run:

```powershell
$env:PLAYWRIGHT_BASE_URL='http://localhost:3100'; pnpm.cmd exec playwright test e2e/admin-mobile.spec.ts --project=admin-mobile --grep "tab labels"
```

Expected: FAIL vì nav hiện chưa có `data-testid`, chưa bo góc ngoài và `mr-14` tạo inset phải lớn hơn inset trái.

### Task 2: Triển khai layout floating

**Files:**
- Modify: `chalo-fe/src/app/(admin)/_components/MobileAdminNav.tsx:25-91`

- [ ] **Step 1: Đơn giản hóa căn chỉnh môi trường dev**

Xóa biến `mobileNavAlignment` và giữ grid luôn full width để 5 mục không bị dồn sang trái.

- [ ] **Step 2: Cập nhật container và grid**

Đổi nav thành layout floating:

```tsx
    <nav
      data-testid="admin-mobile-nav"
      aria-label="Điều hướng admin trên điện thoại"
      className="fixed inset-x-2 bottom-2 z-40 overflow-hidden rounded-2xl border border-gray-200 bg-white/95 px-1.5 pt-1.5 shadow-[0_-6px_24px_rgba(15,23,42,0.12)] backdrop-blur dark:border-gray-800 dark:bg-gray-900/95 md:hidden"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom) + 0.25rem)",
      }}
    >
      <div
        data-testid="admin-mobile-nav-items"
        className="grid w-full grid-cols-5 gap-0.5"
      >
```

- [ ] **Step 3: Làm item khít và nhất quán**

Ở cả `Link` và nút `Khác`, dùng các class chung sau:

```tsx
className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 text-[10px] leading-3 font-medium transition-colors ...`}
```

Giữ nguyên các class màu active/thường, icon `size-5`, `max-w-full truncate` và toàn bộ logic route/modal.

- [ ] **Step 4: Chạy regression test mục tiêu**

Run:

```powershell
$env:PLAYWRIGHT_BASE_URL='http://localhost:3100'; pnpm.cmd exec playwright test e2e/admin-mobile.spec.ts --project=admin-mobile --grep "tab labels"
```

Expected: PASS; nav có bo góc ngoài và inset trái/phải cân nhau trong viewport iPhone 13.

### Task 3: Xác minh toàn bộ

**Files:**
- No additional files.

- [ ] **Step 1: Chạy unit tests**

Run `pnpm.cmd test:unit` và xác nhận 8/8 pass.

- [ ] **Step 2: Chạy TypeScript**

Run `pnpm.cmd exec tsc --noEmit` và xác nhận exit code 0.

- [ ] **Step 3: Chạy toàn bộ mobile E2E**

Run:

```powershell
$env:PLAYWRIGHT_BASE_URL='http://localhost:3100'; pnpm.cmd exec playwright test e2e/admin-mobile.spec.ts --project=admin-mobile
```

Expected: 6/6 pass, bao gồm điều hướng `Khác`, giữ draft và kiểm tra nhãn không clip.

- [ ] **Step 4: Commit thay đổi triển khai**

```powershell
git add chalo-fe/e2e/admin-mobile.spec.ts chalo-fe/src/app/(admin)/_components/MobileAdminNav.tsx
git commit -m "fix: polish floating mobile admin navigation"
```
