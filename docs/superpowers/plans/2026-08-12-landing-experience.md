# Landing Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm mood selector, hơi nước CSS và thanh CTA mobile cho landing Chalo Coffee.

**Architecture:** Mở rộng `PublicLanding` bằng state/callback nội bộ; không thêm endpoint, dependency hoặc store. CSS animation nằm trong `globals.css` và được tắt với reduced-motion.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS v4, Playwright Chromium.

**Spec:** [2026-08-12-landing-experience-design.md](../specs/2026-08-12-landing-experience-design.md)

---

- [ ] Task 1: Thêm mood selector và hành vi chọn category

  **Files:**
  - Modify: `chalo-fe/src/app/_components/PublicLanding.tsx`
  - Modify: `chalo-fe/e2e/public-landing.spec.ts`

  - [ ] Viết assertion Playwright cho ba mood CTA và sau click “Cần tỉnh táo”, heading menu vào viewport cùng chip Cà phê được chọn nếu fixture menu có category đó.
  - [ ] Thêm `selectCategoryFromMood(keywords)` tìm category theo `name.toLocaleLowerCase("vi-VN")`, gọi `setActiveCategoryId`, rồi `document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })`; fallback `all` nếu không tìm thấy.
  - [ ] Render ba button accessible sau CTA hero, không che CTA hiện tại và xếp wrap trên mobile.
  - [ ] Chạy Playwright targeted test; commit `feat: add landing mood shortcuts`.

- [ ] Task 2: Thêm animation hero và thanh CTA mobile

  **Files:**
  - Modify: `chalo-fe/src/app/_components/PublicLanding.tsx`
  - Modify: `chalo-fe/src/app/globals.css`
  - Modify: `chalo-fe/e2e/public-landing.spec.ts`

  - [ ] Thêm vệt hơi nước có class CSS, `aria-hidden`, animation opacity/translate chậm; trong reduced motion animation `none`.
  - [ ] Dùng `IntersectionObserver` trên hero section để set state `showMobileDock`; cleanup observer; render dock chỉ `sm:hidden` khi hero ngoài viewport.
  - [ ] Chừa `pb-24 sm:pb-0` cho landing content để dock không che CTA/footer; Maps link dùng URL hiện có.
  - [ ] Test mobile: dock chưa hiện đầu trang, scroll qua hero thì hiện, click Thực đơn tới `#menu`, body không horizontal overflow; reduced motion CSS được assert ở build/source hoặc computed style.
  - [ ] Chạy `pnpm test:unit`, `pnpm exec tsc --noEmit`, Playwright targeted; commit `feat: enhance mobile landing actions`.

- [ ] Task 3: Kiểm UI, summary và bàn giao

  **Files:**
  - Modify: `docs/superpowers/plans/2026-08-12-landing-experience.md`
  - Create: `docs/superpowers/summaries/2026-08-12-landing-experience-summary.md`

  - [ ] Mở Chromium desktop + 375×667, xem hero/mood/dock và console/network; chụp screenshot mobile.
  - [ ] Chạy `pnpm build` và Playwright targeted lại sau cùng; tick task ngay sau khi pass.
  - [ ] Viết summary bốn mục dựa trên diff, `git diff --check`, commit `docs: summarize landing experience`.

## Kết quả

Summary sẽ được viết tại [2026-08-12-landing-experience-summary.md](../summaries/2026-08-12-landing-experience-summary.md).
