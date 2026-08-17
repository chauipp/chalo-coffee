# Dashboard hành động nhanh — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin thấy ngay đơn cần xử lý, trạng thái ca và tồn kho khi mở dashboard, với link tới đúng workspace.

**Architecture:** Tách hàm thu gọn dữ liệu queue/shift thành utility thuần và một component `ActionHub` chỉ nhận query state. Dashboard ghép ba query hiện có vào component này; không đổi API, database hay quyền.

**Tech Stack:** Next.js, React, TanStack Query, Node test runner, Playwright.

## Global Constraints

- Chỉ tổng hợp dữ liệu hiện có; không tạo API, schema, quyền hoặc notification mới.
- Mỗi thẻ có loading/error/retry độc lập và là link vùng bấm tối thiểu 44px.
- Chạy Playwright mock API ở desktop và 375×667, kiểm console/network và scroll ngang.

---

- [x] Task 1: Utility và hub hành động

**Files:**
- Create: `chalo-fe/src/app/(admin)/admin/dashboard/_components/actionHub.utils.ts`
- Create: `chalo-fe/src/app/(admin)/admin/dashboard/_components/actionHub.utils.test.mts`
- Create: `chalo-fe/src/app/(admin)/admin/dashboard/_components/ActionHub.tsx`

- [x] Viết test fail: queue có 3 đơn và 1 payment-requested trả summary `3 đơn đang xử lý` và `1 yêu cầu thanh toán`; `null` shift trả `Chưa mở ca`.
- [x] Implement `getActiveOrderSummary(orders)` và `getShiftSummary(shift)`; component nhận dữ liệu/loading/error/refetch của từng nguồn, dùng link `/admin/orders`, `/admin/shift`, `/admin/inventory`.
- [x] Chạy `pnpm test:unit` để xác nhận test utility xanh và commit `feat(fe): thêm hub hành động dashboard`.

- [x] Task 2: Ghép dashboard và kiểm browser

**Files:**
- Modify: `chalo-fe/src/app/(admin)/admin/dashboard/page.tsx`
- Modify: `chalo-fe/e2e/admin-dashboard.spec.ts` hoặc tạo `chalo-fe/e2e/admin-dashboard-action-hub.spec.ts`

- [x] Viết Playwright mock session admin + route `/api/order/active`, `/api/shift/current`, `/api/inventory/low-stock`, stats; assert nhãn, link và retry của một query lỗi.
- [x] Render `ActionHub` bên dưới header, truyền `useGetActiveOrder`, `useCurrentShift`, `useLowStockIngredients`; thay cảnh báo kho cũ bằng action card giàu ngữ cảnh hơn.
- [x] Chạy `pnpm build` và Playwright chromium desktop + mobile với console/network assertions, commit `feat(fe): thêm hub hành động dashboard`.

- [x] Task 3: Tổng kết

- [x] Rà diff/full frontend unit, tick tasks, viết `docs/superpowers/summaries/2026-08-17-dashboard-action-hub-summary.md`, commit docs.

## Kết quả

[Tổng kết thực thi](../summaries/2026-08-17-dashboard-action-hub-summary.md)
