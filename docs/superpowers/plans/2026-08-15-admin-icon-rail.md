# Admin Icon Rail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đổi rail chữ khu pha chế thành rail icon kiểu Edge, mở rộng được cho các action admin sau này.

**Architecture:** `AdminPrepSidebarLayout` sẽ khai báo mảng action rail cục bộ, hiện chỉ có action pha chế. Rail luôn render trên desktop; action dùng icon dùng chung của dự án và điều khiển state/pane `PrepDock` hiện hữu, không thay đổi storage hay mobile.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Playwright.

## Global Constraints

- Rail icon chỉ áp dụng desktop (`md:flex`); mobile không thay đổi.
- Hiện tại chỉ có action `Pha chế` với icon cà phê; kiến trúc phải cho phép bổ sung action cùng hình thức.
- Không thêm điều khiển phóng to/thu nhỏ/đóng vào header `PrepStation`.
- Giữ `admin-prep-visible:v1` và `admin-prep-split:v1` nguyên vẹn.

---

- [x] Task 1: Thay rail chữ bằng action icon mở rộng được

**Files:**
- Modify: `chalo-fe/src/app/(admin)/_components/AdminPrepSidebarLayout.tsx:1-78`
- Test: `chalo-fe/e2e/admin-prep-sidebar.spec.ts:13-66`

**Interfaces:**
- Consumes: `CoffeeIcon` từ `@/components/shared/icons/CoffeeIcon`, `visible: boolean`, `setVisibility(next: boolean)`.
- Produces: rail action với `data-testid="admin-prep-rail-action"`, `aria-label="Khu pha chế"`, `aria-pressed={visible}` và `aria-controls="admin-prep-dock"`.

- [x] **Step 1: Cập nhật E2E để định danh action icon, không phụ thuộc rail chữ**

```ts
const launcher = page.getByTestId("admin-prep-rail-action");
await expect(launcher).toBeVisible();
await expect(launcher).toHaveAttribute("aria-label", "Khu pha chế");
await expect(launcher).toHaveAttribute("aria-pressed", "false");
await launcher.click();
await expect(launcher).toHaveAttribute("aria-pressed", "true");
```

- [x] **Step 2: Chạy E2E để xác nhận test thất bại trước khi có selector mới**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3014 pnpm exec playwright test e2e/admin-prep-sidebar.spec.ts --project=chromium --reporter=line`

Expected: FAIL vì `admin-prep-rail-action` chưa tồn tại.

- [x] **Step 3: Thay button rail bằng danh sách action icon**

```tsx
const railActions = [{
  id: "prep",
  label: "Khu pha chế",
  icon: CoffeeIcon,
  active: visible,
  onClick: () => setVisibility(!visible),
}];

{railActions.map(({ id, label, icon: Icon, active, onClick }) => (
  <button key={id} data-testid={`admin-${id}-rail-action`} aria-label={label}
    aria-pressed={active} aria-controls={ADMIN_PREP_DOCK_ID} onClick={onClick}>
    <Icon className="size-5" />
  </button>
))}
```

- [x] **Step 4: Chạy kiểm tra TypeScript và E2E**

Run: `pnpm exec tsc --noEmit --pretty false && PLAYWRIGHT_BASE_URL=http://localhost:3014 pnpm exec playwright test e2e/admin-prep-sidebar.spec.ts --project=chromium --reporter=line`

Expected: cả hai lệnh PASS; action icon giữ rail luôn hiện và mở/đóng pane cạnh nội dung.

- [x] **Step 5: Commit**

```bash
git add chalo-fe/src/app/'(admin)'/_components/AdminPrepSidebarLayout.tsx chalo-fe/e2e/admin-prep-sidebar.spec.ts
git commit -m "feat: use icon rail for admin prep dock"
```

## Kết quả

Xem [summary](../summaries/2026-08-15-admin-icon-rail-summary.md) sau khi hoàn tất.
