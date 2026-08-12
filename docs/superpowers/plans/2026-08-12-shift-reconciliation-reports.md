# Chốt ca, đối soát tiền và báo cáo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ghi sổ thanh toán chính xác, cho phép mở/chốt một ca tiền mặt chung và xem/xuất báo cáo đối soát trên desktop lẫn mobile.

**Architecture:** Thêm ledger cha–con cho một lần thu và các đơn được thu trong lần đó; `cash_shifts` chỉ là lớp phân ca bất biến bên trên ledger. NestJS xác thực số tiền, quyền và tính báo cáo; Next.js chỉ nhập dữ liệu, hiển thị responsive và tạo CSV từ report API.

**Tech Stack:** NestJS 11, TypeORM/PostgreSQL, Next.js 16, React 19, TanStack Query, TypeScript, Jest, Playwright.

## Global Constraints

- Dùng VND integer; chỉ cash có `receivedAmount`/`changeAmount` và backend tự tính tiền thừa.
- Một ca `OPEN` toàn quán; `ADMIN`/`MODERATOR` được mở/chốt, ca đóng bất biến.
- Không chặn thanh toán ngoài ca; report phải phân biệt khoản ngoài ca/chưa đối soát.
- Không commit `.claude/skills/`, `AGENTS.md`, `CLAUDE.md` hoặc local changes ngoài phạm vi.
- UI mới mobile-first, touch target tối thiểu 44px và phải kiểm bằng Playwright.

---

## Cấu trúc file và ranh giới

| File | Trách nhiệm |
|---|---|
| `chalo-be/src/modules/payment/*` | Ledger transaction/allocation và service ghi nhận thanh toán atomically. |
| `chalo-be/src/modules/shift/*` | Entity, DTO, service, report và controller ca tiền mặt. |
| `chalo-be/src/migrations/*ShiftReconciliation.ts` | Schema/rollback/backfill đơn lịch sử. |
| `chalo-be/src/modules/order/*` | Chuyển tất cả điểm thanh toán về payment service, giữ SSE/loyalty hiện hữu. |
| `chalo-fe/src/services/shift/*` | Contract API, TanStack Query và export CSV. |
| `chalo-fe/src/app/(staff)/staff/shift/*` | Màn mở/chốt ca mobile-first. |
| `chalo-fe/src/app/(admin)/admin/shift/*` | Màn report/admin tái sử dụng UI report. |
| `chalo-fe/src/app/(staff)/staff/orders/_components/OrderPaymentPanel.tsx` | Gửi method, tiền khách đưa tới API. |

- [x] Task 1: Tạo schema ledger thanh toán và migration backfill

**Files:**
- Create: `chalo-be/src/modules/payment/entities/payment-transaction.entity.ts`
- Create: `chalo-be/src/modules/payment/entities/payment-allocation.entity.ts`
- Create: `chalo-be/src/migrations/<timestamp>-ShiftReconciliation.ts`
- Modify: `chalo-be/src/modules/order/entities/order.entity.ts`, `chalo-be/src/app.module.ts`
- Test: `chalo-be/src/modules/payment/payment.service.spec.ts`

- [ ] Viết test entity cho unique allocation/order và enum phương thức.
- [ ] Tạo entity `PaymentTransaction`/`PaymentAllocation`, migration up/down, index/foreign keys và backfill paid orders thành `LEGACY`.
- [ ] Chạy `pnpm test -- payment.service.spec.ts --runInBand && pnpm build` trong `chalo-be`.
- [ ] Commit: `feat: add payment reconciliation ledger`.

- [x] Task 2: Tập trung hóa ghi nhận thanh toán của order

**Files:**
- Create: `chalo-be/src/modules/payment/payment.service.ts`, `chalo-be/src/modules/payment/payment.module.ts`, `chalo-be/src/modules/payment/dto/record-payment.dto.ts`
- Modify: `chalo-be/src/modules/order/order.service.ts`, `order.controller.ts`, `dto/*.ts`, `order.module.ts`
- Test: `chalo-be/src/modules/payment/payment.service.spec.ts`, `chalo-be/src/modules/order/order.service.spec.ts`

- [ ] Viết test RED: cash change backend, QR, nhóm orders, retry không tạo allocation thứ hai.
- [ ] Thêm `recordPayment` atomically tạo ledger/allocation trước trạng thái order, tách staff và customer confirmation source.
- [ ] Bắt endpoint staff nhận `method`/`receivedAmount`, truyền staff JWT; giữ checkout public tương thích và source riêng.
- [ ] Chạy backend unit suite và build.
- [ ] Commit: `feat: record payment method and cashier`.

- [x] Task 3: Tạo domain ca, API báo cáo và kiểm thử

**Files:**
- Create: `chalo-be/src/modules/shift/entities/cash-shift.entity.ts`, `shift.service.ts`, `shift.controller.ts`, `shift.module.ts`, `dto/*.ts`
- Modify: `chalo-be/src/modules/payment/*`, `chalo-be/src/app.module.ts`, migration Task 1
- Test: `chalo-be/src/modules/shift/shift.service.spec.ts`

- [ ] Viết test RED cho một ca mở duy nhất, expected/variance, lọc report theo paidAt/ca.
- [ ] Gắn payment staff vào ca đang mở; implement open/current/close/history/report và quyền staff/admin.
- [ ] Bắt ghi chú khi variance khác 0, snapshot số liệu chốt ca, report tách CASH/BANK_TRANSFER/CUSTOMER_CONFIRMATION/LEGACY.
- [ ] Chạy backend unit suite/build.
- [ ] Commit: `feat: add cash shift reconciliation reports API`.

- [x] Task 4: Nối UI thanh toán với sổ cái

**Files:**
- Modify: `chalo-fe/src/services/order/order.{api,queries,types}.ts`, `constants/api-endpoints.ts`, `OrderPaymentPanel.tsx`
- Test: `chalo-fe/src/app/(staff)/staff/orders/_components/payment.utils.test.mts`

- [ ] Cập nhật type/mutation payload cho method và receivedAmount.
- [ ] Sửa panel để cash/QR gửi đúng dữ liệu, giữ validation/tiền thừa hiển thị và invalidate dữ liệu ca/report.
- [ ] Chạy unit tests, TypeScript, build frontend.
- [ ] Commit: `feat: connect staff payment panel to ledger`.

- [x] Task 5: Xây UI mở/chốt ca và report responsive

**Files:**
- Create: `chalo-fe/src/services/shift/{shift.api,shift.queries,shift.types}.ts`, `chalo-fe/src/app/(staff)/staff/shift/page.tsx`, `chalo-fe/src/app/(admin)/admin/shift/page.tsx`
- Create: `chalo-fe/src/components/shift/{ShiftWorkspace,CloseShiftDialog,ReportCards}.tsx`
- Modify: `routes.ts`, `api-endpoints.ts`, staff/admin navigation config, query keys
- Test: `chalo-fe/src/components/shift/*.test.mts`

- [ ] Tạo query/mutation contracts và CSV UTF-8 BOM.
- [ ] Tạo thẻ ca hiện tại, form mở/chốt (ghi chú bắt buộc khi chênh), tổng tiền và bảng giao dịch responsive.
- [ ] Thêm route/navigation cho staff/admin, role-safe và touch target >=44px.
- [ ] Chạy unit tests, TS, build.
- [ ] Commit: `feat: add responsive shift reconciliation workspace`.

- [ ] Task 6: E2E, tài liệu và tích hợp

**Files:**
- Create/Modify: `chalo-fe/e2e/shift-reconciliation.spec.ts`, `docs/superpowers/summaries/2026-08-12-shift-reconciliation-reports-summary.md`
- Modify: plan checkbox và docs vận hành nếu migration cần nhắc thêm.

- [ ] Stub API, kiểm payment QR/cash và mở/chốt ca/report trên desktop, mobile 375×667.
- [ ] Kiểm console/network, chạy full backend/frontend checks và `pnpm exec playwright test`.
- [ ] Tick toàn bộ task, viết summary dựa trên diff/commit, chạy `capturing-what-worked`.
- [ ] Commit: `test: verify shift reconciliation workflows` và integrate sau khi test xanh.

## Kết quả

[2026-08-12-shift-reconciliation-reports-summary.md](../summaries/2026-08-12-shift-reconciliation-reports-summary.md)
