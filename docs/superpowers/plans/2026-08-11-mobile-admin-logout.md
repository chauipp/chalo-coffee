# Mobile Admin Logout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task.

**Goal:** Cho quản trị viên trên điện thoại đăng xuất trực tiếp từ sheet `Khác` và về trang đăng nhập.

**Architecture:** `MobileAdminNav` tiếp tục sở hữu trạng thái bottom sheet; nó nhận callback từ `useLogout` hiện có và render một button hành động sau các link overflow. Playwright chạy với profile iPhone 13 để chứng minh sheet có nút và logout thực sự điều hướng về login.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Zustand, Playwright.

---

- [x] Task 1: Bổ sung kiểm thử E2E mobile cho luồng logout

**Files:**

- Modify: `chalo-fe/e2e/admin-mobile.spec.ts`

**Step 1: Viết test fail**

Thêm test đăng nhập admin, mở button `Khác`, kiểm tra dialog `Mục quản trị khác`, click button tên `Đăng xuất`, chờ URL `**/login` và kiểm tra button `Đăng nhập` hiển thị.

**Step 2: Chạy để xác nhận fail**

Run: `pnpm exec playwright test e2e/admin-mobile.spec.ts --project=admin-mobile --grep="logout"`

Expected: FAIL vì sheet chưa có button `Đăng xuất`.

- [x] Task 2: Render hành động đăng xuất trong mobile admin overflow sheet

**Files:**

- Modify: `chalo-fe/src/app/(admin)/_components/MobileAdminNav.tsx`
- Test: `chalo-fe/e2e/admin-mobile.spec.ts`

**Step 1: Viết implementation tối thiểu**

Import `useLogout`; lấy callback `logout`, và thêm button `type="button"` dưới danh sách link với `onClick={() => void logout()}`. Button mang text chính xác `Đăng xuất`, style đỏ, đường phân cách phía trên, và icon logout đơn giản không ảnh hưởng accessibility.

**Step 2: Chạy test E2E vừa thêm**

Run: `pnpm exec playwright test e2e/admin-mobile.spec.ts --project=admin-mobile --grep="logout"`

Expected: PASS; bấm logout điều hướng tới `/login`.

**Step 3: Chạy kiểm thử hồi quy**

Run: `pnpm test:unit && pnpm exec playwright test e2e/admin-mobile.spec.ts --project=admin-mobile`

Expected: PASS; không làm hỏng điều hướng nổi và các màn mobile admin.

**Step 4: Kiểm UI thật theo `verifying-ui-with-playwright`**

Khởi động `pnpm dev`, mở app ở 375×667, đăng nhập, mở `Khác`, quan sát snapshot/screenshot, click `Đăng xuất`; xác nhận console và network không có lỗi không mong đợi.

**Step 5: Commit**

```bash
git add chalo-fe/src/app/'(admin)'/_components/MobileAdminNav.tsx chalo-fe/e2e/admin-mobile.spec.ts docs/superpowers
git commit -m "feat: add logout to mobile admin navigation"
```

## Kết quả

Sau khi hoàn thành, xem [tổng kết](../summaries/2026-08-11-mobile-admin-logout-summary.md).
