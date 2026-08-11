# Mobile Staff Logout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm nút đăng xuất trực tiếp trên thanh điều hướng staff mobile và bảo đảm nó xoá phiên, về trang đăng nhập.

**Architecture:** `MobileStaffNav` dùng lại `useLogout`, hook xác thực đã có trách nhiệm gọi endpoint logout, xoá state/cookie và hard-navigate đến `/login`. Component chỉ thêm action UI, không thêm state hoặc API.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Playwright.

## Global Constraints

- Chỉ hiển thị action trên mobile (`md:hidden` như navigation hiện tại).
- Không thay đổi route, quyền hay logic xác thực trong `useLogout`.
- Nút có nhãn truy cập được `Đăng xuất` và giữ thanh đáy vừa viewport 375×667.

---

- [x] Task 1: Thêm action đăng xuất cho staff mobile

**Files:**
- Modify: `chalo-fe/src/app/(staff)/_components/MobileStaffNav.tsx`
- Test: `chalo-fe/e2e/staff-mobile-logout.spec.ts`

**Interfaces:**
- Consumes: `useLogout(): () => Promise<void>` từ `@/hooks/useLogout` và `LogoutIcon` từ `@/components/shared/icons/LogoutIcon`.
- Produces: button `Đăng xuất` gọi `void logout()` từ thanh điều hướng mobile staff.

- [x] **Step 1: Viết test Playwright thất bại**

```ts
test("staff mobile đăng xuất từ thanh đáy", async ({ page }) => {
  await loginAsStaff(page);
  await page.setViewportSize({ width: 375, height: 667 });
  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await page.waitForURL("**/login");
});
```

- [x] **Step 2: Chạy test để xác nhận thất bại**

Run: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:<port> pnpm exec playwright test e2e/staff-mobile-logout.spec.ts --project=chromium`

Expected: FAIL vì thanh staff mobile chưa có button tên `Đăng xuất`.

- [x] **Step 3: Chỉnh component tối thiểu**

```tsx
const logout = useLogout();

<button type="button" onClick={() => void logout()} aria-label="Đăng xuất">
  <LogoutIcon aria-hidden="true" />
  <span>Đăng xuất</span>
</button>
```

Đổi grid mobile từ ba thành bốn cột; dùng style đỏ tương ứng menu admin mobile.

- [x] **Step 4: Chạy kiểm chứng**

Run: `pnpm test:unit && pnpm exec tsc --noEmit`

Expected: pass. Mở browser Playwright ở 375×667, đăng nhập staff, kiểm nút thấy được, bấm về `/login`, không overflow ngang, console và network không lỗi.

- [x] **Step 5: Commit**

```bash
git add chalo-fe/src/app/'(staff)'/_components/MobileStaffNav.tsx chalo-fe/e2e/staff-mobile-logout.spec.ts docs/superpowers/
git commit -m "feat: add logout to staff mobile nav"
```

## Kết quả

Xem [summary](../summaries/2026-08-11-mobile-staff-logout-summary.md) sau khi hoàn thành.
