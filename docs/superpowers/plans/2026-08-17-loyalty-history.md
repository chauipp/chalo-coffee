# Lịch sử tích điểm khách hàng — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khách và admin đối chiếu được mọi điểm đã cộng theo từng đơn mà không có quyền đổi điểm.

**Architecture:** CustomerService thêm query ledger ownership-scoped join Order; route customer riêng và route user admin reuse cùng DTO. Frontend thêm service query và disclosure card trong account.

**Tech Stack:** NestJS/TypeORM, Next.js/TanStack Query, Jest, Playwright.

## Global Constraints

- Read-only; không có endpoint tạo/sửa/xóa ledger ngoài payment flow hiện hữu.
- Không lộ order/customer khác, `pageSize` 1–50.
- UI phải có loading/empty/error và kiểm Playwright desktop + 375×667.

---

- [ ] Task 1: API ledger points ownership-scoped

- [ ] Viết test RED cho thứ tự, pagination và chỉ customer đúng owner nhận entry.
- [ ] Implement `CustomerService.getLoyaltyHistory`, DTO/controller customer/admin.
- [ ] Chạy backend test/build, commit `feat(be): thêm lịch sử tích điểm khách hàng`.

- [ ] Task 2: Account/admin UI và kiểm browser

- [ ] Viết test utility/client RED cho định dạng entry/empty state.
- [ ] Thêm query/card lịch sử vào account và customer detail admin.
- [ ] Chạy unit/build/Playwright desktop + mobile, console/network assertions; commit `feat(fe): hiển thị lịch sử tích điểm`.

- [ ] Task 3: Tổng kết

- [ ] Rà full suite/diff, summary `docs/superpowers/summaries/2026-08-17-loyalty-history-summary.md`, tick task, commit docs.

## Kết quả

[Tổng kết thực thi](../summaries/2026-08-17-loyalty-history-summary.md)
