# Landing floating actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm hai nút icon nổi Zalo và Chỉ đường luôn có sẵn trên landing.

**Architecture:** Giữ implementation trong `PublicLanding`, dùng hằng URL sẵn có và state `showMobileDock` để thay đổi khoảng cách đáy. Không thêm component package hoặc endpoint mới.

**Tech Stack:** Next.js, React, Tailwind CSS v4, Playwright Chromium.

## Global Constraints

- Nút tròn tối thiểu 48px, có `aria-label`, mở URL Zalo/Maps hiện có trong tab mới.
- Tooltip chỉ hiện từ breakpoint `sm`; mobile không hiện chữ cố định.
- Khi `showMobileDock` là true, cụm action không được chồng dock và không được tạo horizontal overflow.
- Kiểm giao diện desktop và 375×667 với Playwright trước khi hoàn tất.

**Spec:** [2026-08-12-landing-floating-actions-design.md](../specs/2026-08-12-landing-floating-actions-design.md)

---

- [ ] Task 1: Thêm floating action Zalo và bản đồ

  **Files:**
  - Modify: `chalo-fe/src/app/_components/PublicLanding.tsx`
  - Modify: `chalo-fe/e2e/public-landing.spec.ts`

  **Interfaces:**
  - Consumes: `MAPS_URL`, `ZALO_URL`, `showMobileDock` trong `PublicLanding`.
  - Produces: `navigation` aria-label `Liên hệ nhanh` với hai external link `Nhắn Zalo` và `Chỉ đường`.

  - [ ] Viết assertion Playwright kiểm navigation, `href`, `target=_blank` và trạng thái không tràn ngang mobile.
  - [ ] Thêm wrapper `fixed bottom-4 right-4 z-40 flex flex-col gap-3`, chuyển sang `bottom-20` khi `showMobileDock`; hai link 12×12 có icon SVG và `aria-label`.
  - [ ] Thêm tooltip nhãn đặt bên trái icon với `hidden sm:block`, chỉ mở khi hover/focus bằng group classes.
  - [ ] Chạy `PLAYWRIGHT_BASE_URL=http://localhost:3105 pnpm exec playwright test e2e/public-landing.spec.ts --project=chromium`; commit `feat: add landing floating contact actions`.

- [ ] Task 2: Kiểm giao diện và bàn giao

  **Files:**
  - Modify: `docs/superpowers/plans/2026-08-12-landing-floating-actions.md`
  - Create: `docs/superpowers/summaries/2026-08-12-landing-floating-actions-summary.md`

  - [ ] Dựng app cổng 3105, kiểm Chromium desktop và mobile 375×667; cuộn qua hero để xác nhận actions không che dock.
  - [ ] Kiểm console error, network lỗi, `pnpm test:unit`, `pnpm exec tsc --noEmit`, `pnpm build` và `git diff --check`.
  - [ ] Tick task ngay khi pass, viết summary bốn mục liên kết spec/plan, commit `docs: summarize landing floating actions`.

## Kết quả

Summary sẽ được viết tại [2026-08-12-landing-floating-actions-summary.md](../summaries/2026-08-12-landing-floating-actions-summary.md).
