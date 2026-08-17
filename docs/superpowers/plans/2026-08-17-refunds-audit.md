# Hoàn tiền có kiểm soát và nhật ký vận hành — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin có thể ghi nhận hoàn tiền không vượt tiền đã thu, báo cáo ca phản ánh tiền ròng và thao tác nhạy cảm có audit log.

**Architecture:** Payment module sở hữu refund append-only; Audit module nhận bản ghi trong cùng transaction qua repository. ShiftService tổng hợp refund từ payment transaction thay vì thay đổi dữ liệu payment gốc. Frontend mở action từ lịch sử đơn thanh toán, giữ staff read-only.

**Tech Stack:** NestJS, TypeORM/Postgres numeric integer VND, Next.js, TanStack Query, Jest, Playwright.

## Global Constraints

- Không thực hiện chuyển khoản tự động; đây là bút toán nội bộ do Admin xác nhận.
- Chỉ Admin tạo/read refund và audit; lý do 3–300 ký tự, amount nguyên dương.
- Refund/audit append-only và transaction-safe; tổng refund không vượt payment gốc.
- UI mới bắt buộc kiểm Playwright desktop và 375×667.

---

- [ ] Task 1: Refund domain, API và audit append-only

**Files:**
- Create: `chalo-be/src/modules/payment/entities/refund-transaction.entity.ts`, `src/modules/audit/*`, migration.
- Modify: `payment.module.ts`, `payment.service.ts`, app module và payment controller.
- Test: `payment.service.spec.ts`, `audit.service.spec.ts`.

- [ ] Viết Jest RED cho partial/multiple refund, vượt số còn lại và audit immutable.
- [ ] Thêm entity/migration/refund DTO; tạo transaction lock và endpoints Admin.
- [ ] Ghi audit khi refund thành công, inventory recipe/adjust và cài đặt payment thay đổi.
- [ ] Chạy backend tests/build và commit `feat(be): thêm hoàn tiền và audit vận hành`.

- [ ] Task 2: Báo cáo ca và dữ liệu frontend

**Files:**
- Modify: `chalo-be/src/modules/shift/shift.service.ts`, `shift.module.ts`.
- Modify: `chalo-fe/src/services/{order,shift}/`, constants query/API.
- Test: `shift.service.spec.ts`.

- [ ] Viết test RED cho expected cash, gross/refunds/net của ca.
- [ ] Tổng hợp refunds theo payment/ca và trả DTO net không đổi payment gốc.
- [ ] Thêm service/query types frontend và test/build.
- [ ] Commit `feat: phản ánh hoàn tiền trong báo cáo ca`.

- [ ] Task 3: UI admin hoàn tiền, lịch sử và kiểm UI

**Files:**
- Create: admin refund/audit components and Playwright spec.
- Modify: admin order detail/history and shift workspace.

- [ ] Viết test utility/form RED cho VND/refundable validation.
- [ ] Thêm admin-only dialog confirm, history refund/audit và net report; staff không thấy action.
- [ ] Chạy Playwright mock desktop + 375×667, unit/build, console/network assertions.
- [ ] Commit `feat(fe): hoàn tiền và nhật ký vận hành`.

- [ ] Task 4: Tổng kết

- [ ] Rà diff/check, full suites và migration deploy note.
- [ ] Viết summary `docs/superpowers/summaries/2026-08-17-refunds-audit-summary.md`, tick task.
- [ ] Commit `docs: tổng kết hoàn tiền và audit`.

## Kết quả

[Tổng kết thực thi](../summaries/2026-08-17-refunds-audit-summary.md)
