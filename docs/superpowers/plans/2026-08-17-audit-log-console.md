# Nhật ký hoạt động admin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin tra cứu được 50 thao tác vận hành gần nhất ở một màn read-only, desktop và mobile.

**Architecture:** Trang client gọi `useAuditLogs({ limit: 50 })`, map action/metadata thành câu dễ đọc và lọc trong bộ nhớ. Route/nav dùng hạ tầng admin hiện hữu.

**Tech Stack:** Next.js, TanStack Query, Playwright.

## Global Constraints

- Không có mutation, API, schema hay quyền mới.
- Phải có loading, empty, error/retry và không tràn ở 375×667.

---

- [ ] Task 1: Màn tra cứu và điều hướng

- [ ] Tạo `/admin/audit`, map năm action audit thành nhãn Việt, render metadata không chèn HTML.
- [ ] Thêm route `ROUTES.ADMIN.AUDIT` vào sidebar desktop/mobile overflow.
- [ ] Chạy frontend build và commit `feat(fe): thêm màn nhật ký hoạt động`.

- [ ] Task 2: Kiểm browser và tổng kết

- [ ] Viết Playwright mock session/API kiểm filter, retry và mobile overflow.
- [ ] Chạy Playwright chromium + unit, ghi summary `docs/superpowers/summaries/2026-08-17-audit-log-console-summary.md`, tick task, commit docs.

## Kết quả

[Tổng kết thực thi](../summaries/2026-08-17-audit-log-console-summary.md)
