# Public Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay route `/` đang redirect login bằng landing page Chalo Coffee tối giản, có menu động từ Admin và CTA Maps/Zalo/login.

**Architecture:** Giữ `page.tsx` là server page gọi các menu server services hiện có, sau đó truyền dữ liệu đã lọc vào một client component nhỏ để xử lý chip danh mục và thao tác cuộn. UI landing được tách khỏi auth/admin/customer QR flow; không thêm endpoint hay store mới.

**Tech Stack:** Next.js App Router 16, React 19, TypeScript, Tailwind CSS v4, Node test runner, Playwright Chromium.

**Spec:** [2026-08-11-public-landing-page-design.md](../specs/2026-08-11-public-landing-page-design.md)

## Global Constraints

- `/` không redirect sang `/login`; `/login` vẫn mở đúng form.
- Chỉ categories `isActive` và products `isActive` + `status === AVAILABLE` được hiển thị.
- Maps dùng `https://maps.app.goo.gl/miDX5WUrMF9vxkia8?g_st=ac`; Zalo dùng `https://zalo.me/0913017988`.
- Không hiển thị/link `/register` trên landing; checkout, ship, thanh toán và tạo đơn online ngoài phạm vi.
- Menu cache dùng server service hiện tại với revalidate khoảng một giờ; lỗi/rỗng phải render trạng thái an toàn.
- Mobile-first, không overflow ngang, CTA có vùng bấm đủ lớn, focus ring và alt text không bị loại bỏ.
- Không thêm asset nặng, carousel tự chạy, popup hoặc endpoint menu mới.

---

## File map

- Create: `chalo-fe/src/app/_components/landing-data.ts` — kiểu dữ liệu và hàm lọc/group/format menu thuần, không phụ thuộc React.
- Test: `chalo-fe/src/app/_components/landing-data.test.mts` — kiểm tra lọc trạng thái, thứ tự danh mục/món, giá VND và dữ liệu rỗng.
- Create: `chalo-fe/src/app/_components/PublicLanding.tsx` — client UI của landing: header, hero, menu chip/card, visit CTA và footer.
- Modify: `chalo-fe/src/app/page.tsx` — fetch categories/products, chuyển qua adapter, render `PublicLanding` thay vì `redirect`.
- Modify: `chalo-fe/src/app/layout.tsx` — cập nhật metadata mặc định/mô tả trang chủ nếu cần, giữ provider/auth không đổi.
- Modify: `chalo-fe/src/app/globals.css` — chỉ thêm token/animation/scroll behavior cần thiết nếu Tailwind class không đủ.
- Create: `chalo-fe/e2e/public-landing.spec.ts` — kiểm hành vi landing trên Chromium desktop và mobile.
- Create: `docs/superpowers/summaries/2026-08-11-public-landing-page-summary.md` — ghi kết quả sau khi toàn bộ task pass.

## Task breakdown

- [x] Task 1: Xây adapter menu động và kiểm thử dữ liệu

  **Files:**
  - Create: `chalo-fe/src/app/_components/landing-data.ts`
  - Test: `chalo-fe/src/app/_components/landing-data.test.mts`

  **Interfaces:**
  - Consumes: `CategoryDto` và `ProductDto` từ `@/services/menu/menu.types`.
  - Produces: `LandingCategory[]`, `buildLandingMenu(categories, products)`, `formatVnd(price)`.

  **Steps:**

  - [ ] Viết test đỏ cho các fixture sau: category inactive bị loại; product inactive/`UNAVAILABLE`/`OUT_OF_STOCK` bị loại; category giữ `sortOrder`; product trong category giữ `sortOrder`; giá `25000` thành `25.000đ`; input rỗng trả `[]`.

    ```ts
    const result = buildLandingMenu(categories, products);
    assert.deepEqual(result.map((group) => group.name), ["Cà phê truyền thống"]);
    assert.deepEqual(result[0].products.map((product) => product.name), ["Cà phê đen đá"]);
    assert.equal(formatVnd(25000), "25.000đ");
    ```

  - [ ] Chạy `pnpm test:unit -- src/app/_components/landing-data.test.mts` trong `chalo-fe`; xác nhận test fail vì module chưa tồn tại.
  - [ ] Implement type `LandingProduct`, `LandingCategory`, `buildLandingMenu` bằng filter active/available, sort copy không mutate input, group theo `categoryId`, và bỏ category không còn product hợp lệ.
  - [ ] Implement `formatVnd` bằng `Intl.NumberFormat("vi-VN")` rồi nối `đ`.
  - [ ] Chạy lại cùng test; expected toàn bộ pass.
  - [ ] Commit: `git add chalo-fe/src/app/_components/landing-data.ts chalo-fe/src/app/_components/landing-data.test.mts && git commit -m "feat: prepare public landing menu data"`.

- [x] Task 2: Đổi route `/` và dựng UI landing tối giản responsive

  **Files:**
  - Create: `chalo-fe/src/app/_components/PublicLanding.tsx`
  - Modify: `chalo-fe/src/app/page.tsx`

  **Interfaces:**
  - Consumes: `LandingCategory[]` từ Task 1; `LandingProduct` đã có `imageUrl`, `description`, `price`.
  - Produces: DOM có landmark `header`, `main`, `section#menu`, footer; accessible names “Xem thực đơn”, “Tìm đường tới quán”, “Đăng nhập”, “Nhắn Zalo”.

  **Steps:**

  - [ ] Viết UI test-level assertions trong file e2e ở Task 4 trước khi thay route: các role/name và `#menu` phải tồn tại sau khi route render.
  - [ ] Trong `page.tsx`, xoá `redirect(ROUTES.LOGIN)`, gọi `getMenuCategoriesServer()` và `getMenuProductsServer()` bằng `Promise.all`, truyền `buildLandingMenu(...)` vào `PublicLanding`; catch ở server service hiện tại để page không throw.
  - [ ] Tạo `PublicLanding` với cấu trúc semantic: header logo + links, hero h1 + mô tả + hai CTA, section menu chip/card, visit CTA Maps/Zalo, footer. Dùng `Link` cho `/login`, anchor cho `#menu`, `<a target="_blank" rel="noreferrer">` cho Maps/Zalo.
  - [ ] Render card từ `LandingCategory[]`; chip category dùng state client để lọc nhóm đang xem, chip đầu “Tất cả”; card có `alt` khi có ảnh và placeholder có `aria-hidden` khi thiếu ảnh.
  - [ ] Render empty state “Thực đơn đang được cập nhật” nếu `menu.length === 0`; không render nút đặt món, giỏ hàng hoặc đăng ký.
  - [ ] Dùng palette brand/stone hiện tại, CSS grid responsive (`1` cột mobile, `2–3` cột desktop), horizontal chip scroll không làm tăng `scrollWidth`; CTA đủ lớn cho mobile.
  - [ ] Chạy `pnpm exec tsc --noEmit`; expected exit 0.
  - [ ] Commit: `git add chalo-fe/src/app/page.tsx chalo-fe/src/app/_components/PublicLanding.tsx && git commit -m "feat: add public coffee landing page"`.

- [ ] Task 3: Hoàn thiện metadata, focus, scroll và trạng thái lỗi

  **Files:**
  - Modify: `chalo-fe/src/app/layout.tsx`
  - Modify: `chalo-fe/src/app/globals.css`
  - Modify: `chalo-fe/src/app/_components/PublicLanding.tsx`

  **Interfaces:**
  - Consumes: UI đã render từ Task 2.
  - Produces: metadata/viewport đúng thương hiệu, thao tác keyboard và layout ổn định.

  **Steps:**

  - [ ] Cập nhật metadata default thành title “Chalo Coffee” và description ngắn về cà phê/menu; không đổi providers, theme script hoặc auth initialization.
  - [ ] Thêm `scroll-behavior: smooth` có fallback `@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }`; giữ màu nền/theme coffee-sky hiện tại.
  - [ ] Bổ sung `aria-current` cho chip đang chọn, visible focus ring cho link/button, `aria-label` cho logo nếu logo chỉ là text, và `loading="lazy"` cho ảnh ngoài hero.
  - [ ] Kiểm tra service rỗng/lỗi bằng fixture hoặc tạm mock `buildLandingMenu([], [])`; xác nhận empty state không ném exception và hero/CTA vẫn có.
  - [ ] Chạy `pnpm lint`, `pnpm test:unit`, `pnpm exec tsc --noEmit`; expected 0 lỗi.
  - [ ] Commit: `git add chalo-fe/src/app/layout.tsx chalo-fe/src/app/globals.css chalo-fe/src/app/_components/PublicLanding.tsx && git commit -m "refactor: polish public landing accessibility"`.

- [ ] Task 4: E2E và kiểm tra trực quan desktop/mobile

  **Files:**
  - Create: `chalo-fe/e2e/public-landing.spec.ts`

  **Interfaces:**
  - Consumes: route `/` và menu seed/backend hiện tại; không đổi production code.
  - Produces: regression coverage cho redirect, CTA, dynamic menu, no overflow.

  **Steps:**

  - [ ] Viết test Chromium với `page.goto("/")`, chờ `h1`, xác nhận URL vẫn `/`, header có “Đăng nhập”, không có text/link “Đăng ký”, và section menu có món active/available seed (ví dụ “Cà phê đen đá”) nhưng không có “Cà phê cốt dừa”.
  - [ ] Click “Xem thực đơn”, assert `#menu` visible và scroll position/element bounding box cho thấy section đã vào viewport; click “Đăng nhập”, assert `/login`; quay lại `/`.
  - [ ] Assert Maps/Zalo href chính xác, `target="_blank"`; set viewport 390×844 và assert `document.body.scrollWidth <= document.documentElement.clientWidth`; chụp screenshot full page.
  - [ ] Chạy `pnpm exec playwright test e2e/public-landing.spec.ts --project=chromium`; nếu backend chưa chạy, khởi động backend theo README trước và ghi rõ trong output, không bỏ qua test.
  - [ ] Mở app bằng Chromium ở desktop và mobile để kiểm trực quan màu, spacing, card ảnh placeholder, chip scroll và focus; sửa lỗi nếu thấy rồi chạy lại test.
  - [ ] Chạy full gate: `pnpm test:unit && pnpm exec tsc --noEmit && pnpm build && pnpm exec playwright test e2e/public-landing.spec.ts --project=chromium`.
  - [ ] Commit: `git add chalo-fe/e2e/public-landing.spec.ts && git commit -m "test: verify public landing interactions"`.

- [ ] Task 5: Viết summary và chuẩn bị bàn giao

  **Files:**
  - Create: `docs/superpowers/summaries/2026-08-11-public-landing-page-summary.md`
  - Modify: `docs/superpowers/plans/2026-08-11-public-landing-page.md`

  **Steps:**

  - [ ] Tick từng Task 1–4 ngay sau khi commit và verification tương ứng pass.
  - [ ] Viết summary bốn mục bắt buộc: “Đã làm gì”, “File chính”, “Khác với plan”, “Còn dở / cần lưu ý”; ghi chính xác dựa trên diff/commit, nêu rõ ship/checkout vẫn ngoài phase.
  - [ ] Chạy `git diff --check` và `git status --short`; không stage `.superpowers/` visual-companion artifacts.
  - [ ] Commit docs: `git add docs/superpowers/plans/2026-08-11-public-landing-page.md docs/superpowers/summaries/2026-08-11-public-landing-page-summary.md && git commit -m "docs: summarize public landing page"`.

## Kết quả

Summary sẽ được viết tại `../summaries/2026-08-11-public-landing-page-summary.md` sau khi các task hoàn tất.
