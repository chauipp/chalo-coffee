# Admin Order Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép Admin xóa vĩnh viễn cả đơn chưa và đã thanh toán, đồng thời dọn đúng các dữ liệu phụ thuộc.

**Architecture:** Một endpoint Admin-only thực hiện dọn dữ liệu trong transaction có khóa đơn. Frontend gọi endpoint qua React Query, xác nhận hành động, rồi invalidates các vùng dữ liệu bị ảnh hưởng.

**Tech Stack:** NestJS, TypeORM/PostgreSQL, Next.js/React, TanStack Query, Jest.

## Global Constraints

- Chỉ `ADMIN` được xóa đơn.
- Xóa thật, không thể khôi phục; xóa cả điểm thưởng và payment allocation liên quan.
- Thanh toán gộp phải giữ giao dịch của các đơn còn lại và điều chỉnh số tiền giao dịch.
- Không commit `chalo-fe/AGENTS.md` hay `package-lock.json` sinh tự động.

---

- [x] Task 1: Xóa đơn an toàn ở backend

**Files:**
- Modify: `chalo-be/src/modules/order/order.service.ts`
- Modify: `chalo-be/src/modules/order/order.controller.ts`
- Modify: `chalo-be/src/modules/order/order.module.ts`
- Create: `chalo-be/src/modules/order/order.service.delete.spec.ts`

**Interfaces:**
- Produces: `OrderService.deleteByAdmin(id: string): Promise<{ id: string }>`.
- Produces: `DELETE /order/:id`, role `ADMIN` only.

- [ ] Step 1: Viết test fail cho đơn đã thanh toán riêng lẻ: allocation, payment transaction, loyalty, items và order đều được dọn.
- [ ] Step 2: Chạy `npm test -- order.service.delete.spec.ts --runInBand` trong `chalo-be` và xác nhận fail vì method chưa tồn tại.
- [ ] Step 3: Cài các repository cần thiết vào `OrderModule`; implement transaction khóa đơn, điều chỉnh hoặc xóa transaction và dọn các quan hệ trước khi xóa order.
- [ ] Step 4: Thêm endpoint `DELETE /order/:id` với `@Roles(UserRole.ADMIN)`.
- [ ] Step 5: Chạy lại test riêng và toàn bộ `npm test -- --runInBand`, sau đó `npm run build` trong `chalo-be`.
- [ ] Step 6: Commit `feat: let admins permanently delete orders`.

- [x] Task 2: Action xóa ở Admin Orders

**Files:**
- Modify: `chalo-fe/src/constants/api-endpoints.ts`
- Modify: `chalo-fe/src/services/order/order.api.ts`
- Modify: `chalo-fe/src/services/order/order.queries.ts`
- Modify: `chalo-fe/src/app/(admin)/admin/orders/page.tsx`

**Interfaces:**
- Produces: `deleteOrder(id: string): Promise<{ id: string }>` và `useDeleteOrder()`.
- Consumes: action `DELETE /order/:id` của Task 1.

- [ ] Step 1: Viết test/harness fail cho mutation xóa đơn invalidate `ORDERS.ALL`, `TABLES.LIST`, doanh thu và ca.
- [ ] Step 2: Chạy test đó và xác nhận fail vì mutation chưa tồn tại.
- [ ] Step 3: Bổ sung API endpoint, mutation và các invalidation.
- [ ] Step 4: Bổ sung nút Xóa trong bảng/thẻ mobile cùng hộp xác nhận bắt buộc.
- [x] Step 5: Chạy `npm run test:unit` và `npm run build` trong `chalo-fe`; thử Playwright admin UI nếu server khởi động được. Unit test (20/20) và build đã pass; Playwright bị chặn vì Next dev server mới không giữ được cổng trong môi trường đang quá nhiều watcher/server.
- [ ] Step 6: Commit `feat: add admin order delete action`.

## Kết quả

Sẽ ghi tại [summary](../summaries/2026-08-12-admin-order-delete-summary.md) sau khi cả hai task hoàn tất.
