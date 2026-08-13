# Trạng thái trực quan và thời gian chờ theo đơn khách — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Diễn đạt đúng bước phục vụ đang diễn ra, đánh dấu trực quan bước hiện tại và hiển thị ETA của từng đơn ở cả danh sách lẫn chi tiết.

**Architecture:** Giữ bốn vị trí stepper nhưng tách metadata trình bày khỏi trạng thái API: mỗi vị trí tự suy ra nhãn `đang` hoặc `đã` từ chỉ số bước hiện tại. `CONFIRMED` chỉ hoàn tất tiếp nhận và không đặt bước active giả định. `OrderCardCinematic` dùng trực tiếp ETA trên `OrderDto`, còn trang chi tiết giữ thẻ ETA cùng quy ước copy; không đổi backend hoặc dữ liệu đơn.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS v4, Playwright.

## Global Constraints

- Không thay đổi API, backend, `OrderDto`, quy tắc tính `estimateWaitMinutes`, trạng thái staff hoặc thanh toán.
- `PENDING` là bước tiếp nhận đang hoạt động; `CONFIRMED` và mọi trạng thái sau là tiếp nhận đã xong; riêng `CONFIRMED` không có bước active.
- Giữ đúng bốn vị trí tiến trình; không tạo bước riêng cho `CONFIRMED`.
- Bỏ chữ `Đang tiến hành…`; chỉ bước hiện tại có nhấn màu/chấm animation tôn trọng `motion-safe`.
- ETA chỉ hiện khi `estimateWaitMinutes > 0` và đơn không `COMPLETED`/`CANCELLED`.
- Phải kiểm browser desktop và 375×667, console/network sạch trước khi hoàn tất.

---

- [ ] Task 1: Chuẩn hoá metadata tiến trình và stepper trạng thái

### Task 1: Chuẩn hoá metadata tiến trình và stepper trạng thái

  **Files:**
  - Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/page.tsx`
  - Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/ServiceStepper.Cinematic.tsx`
  - Test: `chalo-fe/e2e/customer-order-progress-wait.spec.ts`

  **Interfaces:**
  - Consumes: `OrderStatus`, `order.status` và cấu trúc `SERVICE_STEPS` bốn vị trí.
  - Produces: stepper nhận `currentStepIndex` và render nhãn theo trạng thái `đang`/`đã`, không còn phụ đề chung chung.

  - [ ] **Step 1: Viết test e2e trạng thái chờ tiếp nhận**

    Tạo fixture `OrderDto` PENDING có `estimateWaitMinutes: 8`, intercept `GET /api/order/customer/*`, rồi mở chi tiết đơn. Assert có `Đang tiếp nhận`, không có `Đang tiến hành`, và phần tử bước hiện tại mang locator `data-testid="service-step-active"`.

  - [ ] **Step 2: Viết test e2e trạng thái hoàn thành từng bước**

    Dùng fixture PREPARING và READY. Với PREPARING, assert `Đã tiếp nhận` và `Đang pha chế`; với READY, assert `Đã pha chế` và `Sẵn sàng phục vụ`. Dùng fixture COMPLETED assert `Đã sẵn sàng phục vụ`, `Đã phục vụ`, và không có `service-step-active`.

  - [ ] **Step 3: Khai báo nhãn đang/đã cho bốn vị trí**

    Thay `label` ở `SERVICE_STEPS` bằng `{ activeLabel, completedLabel }`; suy ra `currentStepIndex` bằng map `PENDING: 0`, `PREPARING: 1`, `READY: 2`, `COMPLETED: 3`, còn `CONFIRMED: -1`:

    ```ts
    { statuses: ["PENDING", "CONFIRMED"], activeLabel: "Đang tiếp nhận", completedLabel: "Đã tiếp nhận", emoji: "📋" }
    { statuses: ["PREPARING"], activeLabel: "Đang pha chế", completedLabel: "Đã pha chế", emoji: "☕" }
    { statuses: ["READY"], activeLabel: "Sẵn sàng phục vụ", completedLabel: "Đã sẵn sàng phục vụ", emoji: "🔔" }
    { statuses: ["COMPLETED"], activeLabel: "Đã phục vụ", completedLabel: "Đã phục vụ", emoji: "🎁" }
    ```

  - [ ] **Step 4: Render bước hiện tại bằng nhãn và nhấn riêng**

    Trong `ServiceStepperCinematic`, chọn `activeLabel` chỉ khi `isCurrent`; dùng `completedLabel` cho `isDone`; thêm `data-testid="service-step-active"` vào đúng hàng hiện tại. Bỏ paragraph `Đang tiến hành...`; thêm chấm `motion-safe:animate-pulse` cạnh nhãn hiện tại, vòng nhấn hiện có giữ `motion-safe` để reduced-motion không rung.

  - [ ] **Step 5: Chạy e2e mới**

    Run: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:<port> pnpm --dir chalo-fe exec playwright test e2e/customer-order-progress-wait.spec.ts`
    Expected: PENDING, PREPARING, READY và COMPLETED đều xanh với nhãn đúng.

  - [ ] **Step 6: Commit**

    ```bash
    git add 'chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]' chalo-fe/e2e/customer-order-progress-wait.spec.ts
    git commit -m "feat: clarify customer order progress states"
    ```

- [ ] Task 2: Hiển thị thời gian chờ của từng đơn ở danh sách và chi tiết

### Task 2: Hiển thị thời gian chờ của từng đơn ở danh sách và chi tiết

  **Files:**
  - Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/_components/OrderCard.Cinematic.tsx`
  - Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/OrderDetailView.Cinematic.tsx`
  - Modify: `chalo-fe/e2e/customer-order-progress-wait.spec.ts`

  **Interfaces:**
  - Consumes: `OrderDto.estimateWaitMinutes`, `OrderDto.status`.
  - Produces: `Chờ dự kiến: ~N phút` cho mỗi đơn đủ điều kiện ở card và chi tiết.

  - [ ] **Step 1: Mở rộng e2e ETA theo từng đơn**

    Intercept danh sách với hai đơn PENDING có ETA 8 và PREPARING có ETA 3; mở `/menu/<token>/orders` và assert mỗi card chứa đúng `Chờ dự kiến: ~8 phút` hoặc `Chờ dự kiến: ~3 phút`. Mở chi tiết đơn ETA 8 và assert cùng copy.

  - [ ] **Step 2: Viết case ẩn ETA**

    Trong fixture thêm COMPLETED có ETA 5, CANCELLED có ETA 2 và một PENDING ETA `null`; assert card/chi tiết các đơn này không render text `Chờ dự kiến:`.

  - [ ] **Step 3: Thêm nhãn ETA vào OrderCardCinematic**

    Tạo boolean:

    ```ts
    const showEstimatedWait = order.estimateWaitMinutes !== null && order.estimateWaitMinutes > 0 && order.status !== "COMPLETED" && order.status !== "CANCELLED";
    ```

    Render nhãn `⏱ Chờ dự kiến: ~{order.estimateWaitMinutes} phút` ở dưới chip trạng thái, trước danh sách món; không tính ETA từ các đơn khác.

  - [ ] **Step 4: Chuẩn hoá thẻ ETA ở trang chi tiết**

    Giữ điều kiện `showEstimatedWait` tương đương và thay copy hiện tại bằng nhãn `Chờ dự kiến` cùng giá trị `~{order.estimateWaitMinutes} phút`.

  - [ ] **Step 5: Chạy test ETA**

    Run: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:<port> pnpm --dir chalo-fe exec playwright test e2e/customer-order-progress-wait.spec.ts`
    Expected: ETA đúng theo từng fixture và ẩn ở trạng thái không hợp lệ.

  - [ ] **Step 6: Commit**

    ```bash
    git add 'chalo-fe/src/app/(customer)/menu/[tableToken]/orders' chalo-fe/e2e/customer-order-progress-wait.spec.ts
    git commit -m "feat: show customer order wait estimates"
    ```

- [ ] Task 3: Kiểm UI và ghi nhận kết quả

### Task 3: Kiểm UI và ghi nhận kết quả

  **Files:**
  - Modify: `docs/superpowers/plans/2026-08-13-customer-order-progress-wait.md`
  - Create: `docs/superpowers/summaries/2026-08-13-customer-order-progress-wait-summary.md`

  **Interfaces:**
  - Consumes: hai task UI hoàn tất và fixture e2e.
  - Produces: kiểm chứng browser, plan đã tick, summary phản ánh diff thực tế.

  - [ ] **Step 1: Chạy build production**

    Run: `pnpm --dir chalo-fe build`
    Expected: Next.js compile và TypeScript thành công.

  - [ ] **Step 2: Dựng app và kiểm browser desktop**

    Chạy standalone theo `docs/recipes/playwright-middleware-standalone.md`, mở danh sách và chi tiết bằng Playwright. Xác nhận ETA từng thẻ, PENDING có animation/chấm nhấn, PREPARING/READY đổi đúng nhãn cũ thành `đã`, và không xuất hiện `Đang tiến hành…`.

  - [ ] **Step 3: Kiểm mobile, console và network**

    Chuyển viewport 375×667, kiểm chữ/ETA không tràn; thu console và network, không có lỗi JS hoặc request 4xx/5xx ngoài dự tính.

  - [ ] **Step 4: Tick plan và viết summary**

    Sau khi mọi kiểm chứng xanh, đổi checkbox Task 1–3 thành `- [x]`; tạo summary gồm bốn mục bắt buộc: Đã làm gì, File chính, Khác với plan, Còn dở / cần lưu ý. Đầu summary liên kết spec và plan.

  - [ ] **Step 5: Commit tài liệu**

    ```bash
    git add docs/superpowers/plans/2026-08-13-customer-order-progress-wait.md docs/superpowers/summaries/2026-08-13-customer-order-progress-wait-summary.md
    git commit -m "docs: record customer order progress update"
    ```

## Kết quả

[Xem summary khi hoàn tất](../summaries/2026-08-13-customer-order-progress-wait-summary.md).
