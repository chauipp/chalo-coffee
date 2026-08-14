# Admin Realtime Order Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa board vận hành đơn realtime đầy đủ và `PrepDock` có thể mở/ẩn vào màn `/admin/orders`, dùng chung hành vi với staff.

**Architecture:** Tách board, cấu hình trạng thái, card và cột khỏi route staff thành các component dùng chung. Staff tiếp tục dùng `StaffLayout` hiện tại; admin orders bọc board bằng split-pane cục bộ, có trạng thái dock riêng và một route modal chi tiết admin dùng chung nội dung thanh toán.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, TanStack Query, Playwright, Node test runner.

## Global Constraints

- Không thay đổi API/backend, enum trạng thái hoặc quyền server.
- `/staff/orders` và `/admin/orders` phải dùng cùng board/card/column logic.
- `PrepDock` admin mặc định thu gọn; storage key admin không dùng chung với `staff-prep-split`.
- Thanh toán staff/admin mặc định “Cả bàn”, vẫn giữ option “Đơn này”.
- Mọi thay đổi UI phải được kiểm tra bằng Playwright ở desktop và viewport mobile trước khi báo xong.
- Không làm `AdminLayout` biến thành split-pane; chỉ `/admin/orders` có dock.

---

## - [x] Task 1: Tách board vận hành và cấu hình trạng thái dùng chung

**Files:**
- Create: `chalo-fe/src/components/orders/operations/orders.config.ts`
- Create: `chalo-fe/src/components/orders/operations/OrderOperationsBoard.tsx`
- Create: `chalo-fe/src/components/orders/operations/KanbanColumn.tsx`
- Create: `chalo-fe/src/components/orders/operations/OrderCard.tsx`
- Modify: `chalo-fe/src/app/(staff)/staff/orders/page.tsx`
- Modify: `chalo-fe/src/app/(staff)/staff/orders/_components/OrderCard.tsx`
- Modify: `chalo-fe/src/app/(staff)/staff/orders/_components/KanbanColumn.tsx`
- Test: `chalo-fe/src/components/orders/operations/orders.config.test.mts`

**Interfaces:**
- `OrderOperationsBoard` nhận `{ orders, isLoading, isLive, onRefresh, onStatusChange, detailHref, prepDockToggle? }`.
- `OrderCard` nhận `{ order, onStatusChange, isUpdating, detailHref }` và không tự biết đang ở admin hay staff.
- `orders.config.ts` xuất `KANBAN_COLUMNS`, `KHACH_DAT_STATUSES`, `NEXT_STATUS`, `NEXT_STATUS_LABEL`, `orderDragType`.

- [ ] **Step 1: Viết test đỏ** cho `KHACH_DAT_STATUSES` gom `PENDING`/`CONFIRMED`, `NEXT_STATUS` không tự chuyển `PREPARING → READY`, và `orderDragType` tạo MIME type ổn định.
- [ ] **Step 2: Chạy test đỏ**

  Run: `node --test --experimental-strip-types src/components/orders/operations/orders.config.test.mts`

  Expected: FAIL vì module/config dùng chung chưa tồn tại.

- [ ] **Step 3: Tách config và component** từ các file staff, giữ nguyên hành vi lọc cột: `PREPARING` do `PrepDock` hiển thị, không tạo cột pha chế thứ hai.
- [ ] **Step 4: Sửa staff page** để chỉ giữ data/SSE/mutation và render `OrderOperationsBoard`; truyền `detailHref={(id) => "/staff/orders/orders/" + id}`.
- [ ] **Step 5: Chạy test unit và lint**

  Run: `node --test --experimental-strip-types src/components/orders/operations/orders.config.test.mts && npm run lint`

  Expected: PASS, không có lỗi lint.

- [ ] **Step 6: Commit**

  Run: `git add chalo-fe/src/components/orders/operations chalo-fe/src/app/(staff)/staff/orders && git commit -m "refactor: share order operations board"`

## - [x] Task 2: Tách nội dung chi tiết đơn và route modal dùng được cho admin

**Files:**
- Create: `chalo-fe/src/components/orders/OrderDetailModalContent.tsx`
- Create: `chalo-fe/src/app/(admin)/admin/orders/@modal/default.tsx`
- Create: `chalo-fe/src/app/(admin)/admin/orders/@modal/(.)orders/[orderId]/page.tsx`
- Modify: `chalo-fe/src/app/(staff)/staff/orders/@modal/(.)orders/[orderId]/page.tsx`
- Modify: `chalo-fe/src/app/(staff)/staff/orders/_components/OrderPaymentPanel.tsx`
- Test: `chalo-fe/e2e/admin-order-detail.spec.ts`

**Interfaces:**
- `OrderDetailModalContent` nhận `orderId`, `closeHref`, `onClose`, và `onSuccess`; dùng chung `OrderPaymentPanel`.
- Admin route mở detail bằng `/admin/orders/orders/:orderId`; staff route vẫn mở `/staff/orders/orders/:orderId`.

- [ ] **Step 1: Viết test đỏ** kiểm tra admin click thẻ đơn mở heading “Chi tiết đơn hàng”, nút thanh toán hiển thị, và thanh toán panel có radio “Cả bàn” checked mặc định.
- [ ] **Step 2: Chạy test đỏ**

  Run: `PLAYWRIGHT_BASE_URL=http://localhost:3001 npx playwright test e2e/admin-order-detail.spec.ts --project=chromium`

  Expected: FAIL vì admin route/modal chưa tồn tại.

- [ ] **Step 3: Tách phần JSX/modal content** khỏi staff route, giữ nguyên các mutation update status, in receipt, pager và thanh toán.
- [ ] **Step 4: Tạo intercepted modal route admin** và truyền base path admin; không copy logic chi tiết sang file thứ hai.
- [ ] **Step 5: Đặt default `initialScope = "table"`** ở `OrderPaymentPanel`, vẫn render và cho phép chọn “Đơn này”.
- [ ] **Step 6: Chạy test admin detail và test payment hiện có**

  Run: `PLAYWRIGHT_BASE_URL=http://localhost:3001 npx playwright test e2e/admin-order-detail.spec.ts e2e/staff-payment-default-scope.spec.ts --project=chromium`

  Expected: PASS; radio “Cả bàn” checked ở cả hai khu.

- [ ] **Step 7: Commit**

  Run: `git add chalo-fe/src/components/orders/OrderDetailModalContent.tsx chalo-fe/src/app/(admin)/admin/orders chalo-fe/src/app/(staff)/staff/orders chalo-fe/src/components/shared && git commit -m "feat: share order detail modal with admin"`

## - [ ] Task 3: Biến `/admin/orders` thành màn vận hành + lịch sử rõ ràng

**Files:**
- Modify: `chalo-fe/src/app/(admin)/admin/orders/page.tsx`
- Create: `chalo-fe/src/app/(admin)/admin/orders/_components/AdminOrdersHistory.tsx`
- Create: `chalo-fe/src/app/(admin)/admin/orders/_components/AdminOrdersModeSwitch.tsx`
- Test: `chalo-fe/e2e/admin-orders-operations.spec.ts`

**Interfaces:**
- Trang admin giữ query/pagination/filter của lịch sử trong `AdminOrdersHistory`.
- Mode switch có hai trạng thái URL-stable: `?view=operations` và `?view=history`; mặc định `operations`.
- Operations view dùng `useGetActiveOrder`, `useUpdateOrderStatus`, `useSSE` và `OrderOperationsBoard`.

- [ ] **Step 1: Viết test đỏ**: `/admin/orders` mặc định có heading/khu board realtime; chuyển “Lịch sử” vẫn thấy filter trạng thái/bàn/ngày và DataTable.
- [ ] **Step 2: Chạy test đỏ**

  Run: `PLAYWRIGHT_BASE_URL=http://localhost:3001 npx playwright test e2e/admin-orders-operations.spec.ts --project=chromium`

  Expected: FAIL vì admin page hiện chỉ có DataTable.

- [ ] **Step 3: Tách DataTable hiện tại** vào `AdminOrdersHistory`, giữ nguyên delete dialog, mobile filter sheet, pagination và empty state.
- [ ] **Step 4: Thêm mode switch** và đọc/ghi `view` qua `useSearchParams`/router; không làm mất filter lịch sử khi đổi mode.
- [ ] **Step 5: Kết nối operations view** với active orders, SSE, refresh, status mutation và route detail admin.
- [ ] **Step 6: Chạy test admin operations + unit + lint**

  Run: `PLAYWRIGHT_BASE_URL=http://localhost:3001 npx playwright test e2e/admin-orders-operations.spec.ts --project=chromium && npm run test:unit && npm run lint`

  Expected: PASS; admin hiển thị board, filter lịch sử vẫn hoạt động.

- [ ] **Step 7: Commit**

  Run: `git add chalo-fe/src/app/(admin)/admin/orders && git commit -m "feat: add realtime order operations to admin"`

## - [ ] Task 4: Thêm PrepDock admin thu gọn/mở rộng và lưu trạng thái riêng

**Files:**
- Modify: `chalo-fe/src/app/(staff)/_components/SplitPane.tsx`
- Modify: `chalo-fe/src/app/(staff)/_components/PrepDock.tsx`
- Create: `chalo-fe/src/app/(admin)/admin/orders/_components/AdminOrdersOperationsLayout.tsx`
- Create: `chalo-fe/src/app/(admin)/admin/orders/_components/AdminPrepDockDrawer.tsx`
- Test: `chalo-fe/src/app/(staff)/_components/SplitPane.admin-state.test.mts`

**Interfaces:**
- `AdminOrdersOperationsLayout` nhận `board` và `prepDock`, quản lý `dockVisible` với storage key `admin-orders-prep-visible:v1`.
- Split-pane desktop dùng ratio key `admin-orders-prep-split:v1`; staff tiếp tục dùng `staff-prep-split`.
- Mobile dùng `AdminPrepDockDrawer` với nút “Mở khu pha chế”/“Thu gọn khu pha chế”, focus/close bằng Escape.

- [ ] **Step 1: Viết test đỏ** cho storage key độc lập: giá trị staff không làm admin dock mở, lần đầu admin `dockVisible` là `false`, toggle lưu `true/false`.
- [ ] **Step 2: Chạy test đỏ**

  Run: `node --test --experimental-strip-types src/app/(staff)/_components/SplitPane.admin-state.test.mts`

  Expected: FAIL vì admin visibility state chưa có.

- [ ] **Step 3: Mở rộng SplitPane tối thiểu** để nhận `visible`, `onToggleVisible` và không mount panel desktop khi admin đang ẩn; không đổi mặc định staff.
- [ ] **Step 4: Tạo wrapper admin**: desktop render board toàn chiều rộng khi dock ẩn; khi mở render SplitPane + PrepDock; mobile render board và drawer overlay.
- [ ] **Step 5: Thêm nút điều khiển accessible** với `aria-expanded`, `aria-controls`, Escape đóng drawer và không làm mất state board.
- [ ] **Step 6: Chạy test state, lint và test desktop/mobile**

  Run: `node --test --experimental-strip-types src/app/(staff)/_components/SplitPane.admin-state.test.mts && npm run lint && PLAYWRIGHT_BASE_URL=http://localhost:3001 npx playwright test e2e/admin-orders-operations.spec.ts --project=chromium`

  Expected: PASS; dock mặc định ẩn, mở được trên desktop/mobile, không ảnh hưởng staff.

- [ ] **Step 7: Commit**

  Run: `git add chalo-fe/src/app/(staff)/_components/SplitPane.tsx chalo-fe/src/app/(staff)/_components/PrepDock.tsx chalo-fe/src/app/(admin)/admin/orders/_components && git commit -m "feat: add collapsible admin prep dock"`

## - [ ] Task 5: Hoàn thiện responsive, quyền truy cập và regression

**Files:**
- Modify: `chalo-fe/src/app/(admin)/admin/orders/page.tsx`
- Modify: `chalo-fe/src/app/(admin)/admin/orders/_components/AdminOrdersOperationsLayout.tsx`
- Modify: `chalo-fe/e2e/admin-orders-operations.spec.ts`
- Create: `chalo-fe/e2e/admin-orders-mobile.spec.ts`

- [ ] **Step 1: Viết test đỏ** cho viewport 375×667: không có horizontal overflow, nút mở dock nằm trong viewport, drawer đóng được bằng nút và Escape.
- [ ] **Step 2: Chạy test đỏ**

  Run: `PLAYWRIGHT_BASE_URL=http://localhost:3001 npx playwright test e2e/admin-orders-mobile.spec.ts --project=chromium`

  Expected: FAIL trước khi drawer responsive hoàn thiện.

- [ ] **Step 3: Kiểm tra auth/route**: customer không vào được `/admin/orders`, admin vào được board, staff routes không bị đổi.
- [ ] **Step 4: Thêm assertions console/network** cho operations desktop/mobile; SSE disconnect chỉ được coi là trạng thái UI dự kiến, không che lỗi request API khác.
- [ ] **Step 5: Chạy toàn bộ kiểm tra**

  Run: `npm run test:unit && npm run lint && PLAYWRIGHT_BASE_URL=http://localhost:3001 npx playwright test e2e/admin-orders-operations.spec.ts e2e/admin-orders-mobile.spec.ts e2e/admin-order-detail.spec.ts --project=chromium`

  Expected: toàn bộ test PASS, không có lỗi console ngoài cảnh báo framework đã biết, không có response API 4xx/5xx ngoài SSE được stub trong test.

- [ ] **Step 6: Commit**

  Run: `git add chalo-fe/src/app/(admin)/admin/orders chalo-fe/e2e && git commit -m "test: verify admin order operations responsive flow"`

## Kết quả

Sau khi toàn bộ task được tick, viết summary tại [2026-08-14-admin-operations-orders-summary.md](../summaries/2026-08-14-admin-operations-orders-summary.md), trỏ ngược về spec và plan.
