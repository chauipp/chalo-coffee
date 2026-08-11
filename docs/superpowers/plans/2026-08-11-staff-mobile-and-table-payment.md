# Staff mobile và thanh toán tại bàn Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện trải nghiệm staff trên mobile cho Đơn hàng, POS, Bàn và bổ sung thanh toán gộp tại bàn với lựa chọn QR hoặc tiền mặt trên cả PC/mobile.

**Architecture:** Giữ API thanh toán gộp hiện có, thêm một component thanh toán dùng chung cho chi tiết bàn. Mobile dùng shell riêng với bottom navigation; các trang staff giữ state/query hiện tại nhưng đổi layout theo breakpoint và dùng sheet cho giỏ/chi tiết. Khu pha chế chỉ giữ trên desktop.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, TanStack Query, qrcode.react, Vitest/Jest hiện có, Playwright.

## Global Constraints

- Không mở rộng schema hoặc lưu phương thức thanh toán/tiền khách đưa trong đợt này.
- QR phải dùng cấu hình ngân hàng hiện có và nền trắng.
- Tiền mặt chỉ xác nhận khi tiền khách đưa >= tổng tiền; hiển thị tiền thừa theo `vi-VN`.
- Nút/vùng chạm mobile tối thiểu khoảng 44px.
- Khu pha chế không xuất hiện trong điều hướng mobile và desktop không đổi hành vi.
- Không merge, push hoặc deploy khi chưa có yêu cầu riêng.

---

- [x] Task 1: Tách logic thanh toán và tạo component popup dùng chung

**Files:**
- Create: `chalo-fe/src/app/(staff)/staff/tables/_components/payment.utils.ts`
- Create: `chalo-fe/src/app/(staff)/staff/tables/_components/TablePaymentModal.tsx`
- Modify: `chalo-fe/src/services/order/order.queries.ts` (chỉ nếu cần expose invalidate/query key hiện có)
- Test: `chalo-fe/src/app/(staff)/staff/tables/_components/payment.utils.test.ts`

**Interfaces:**
- `calculateCashChange(total: number, received: number): { valid: boolean; change: number }` trả `valid=false` cho input không hợp lệ hoặc thiếu tiền.
- `TablePaymentModal` nhận `table: TableDto`, `totalUnpaid: number`, `onClose: () => void`, `onSuccess: () => void` và gọi `usePayAllOrders(table.qrToken)` khi xác nhận.

- [ ] Step 1: Viết test đỏ cho tiền thiếu, vừa đủ, tiền thừa, chuỗi rỗng và số âm.
- [ ] Step 2: Chạy test helper để xác nhận fail vì chưa có hàm.
- [ ] Step 3: Viết `calculateCashChange` thuần, chuẩn hoá số nhập và không dùng giá trị floating-point.
- [ ] Step 4: Chạy test helper và xác nhận pass.
- [ ] Step 5: Đọc `buildVietQR`, `useGetSettings`/query cấu hình ngân hàng và `usePayAllOrders`; dựng modal có hai lựa chọn `QR chuyển khoản`/`Tiền mặt`, loading, đóng bằng nền/Escape và lỗi giữ modal mở.
- [ ] Step 6: Với QR, tạo payload bằng tổng tiền và thông tin ngân hàng; nếu thiếu cấu hình hiển thị hướng dẫn cấu hình. Với tiền mặt, render input số, tiền thừa và disable xác nhận khi thiếu.
- [ ] Step 7: Chạy typecheck và test liên quan.
- [ ] Step 8: Commit `feat: add staff table payment method modal`.

- [x] Task 2: Gắn thanh toán vào chi tiết bàn trên PC và mobile

**Files:**
- Modify: `chalo-fe/src/app/(staff)/staff/tables/_components/TableDrawer.tsx`
- Modify: `chalo-fe/src/app/(staff)/staff/tables/page.tsx`
- Modify: `chalo-fe/src/app/(staff)/staff/tables/_components/TableDrawer.tsx` responsive classes
- Test: `chalo-fe/src/app/(staff)/staff/tables/_components/TableDrawer.test.tsx` (nếu test harness hiện có hỗ trợ component)

**Interfaces:**
- `TableDrawer` quản lý `showPayment`; khi `totalUnpaid > 0` render `TablePaymentModal` với table hiện tại.
- Sau `onSuccess`, đóng modal/drawer và invalidate `QUERY_KEYS.TABLES` cùng order queries đang dùng.

- [ ] Step 1: Viết test/fixture cho bàn OCCUPIED có nhiều đơn chưa thanh toán và kiểm tra tổng được gộp.
- [ ] Step 2: Thêm nút `Thanh toán` vào footer drawer khi có tổng chưa thanh toán; không render khi bàn trống hoặc đã trả hết.
- [ ] Step 3: Render modal dùng chung, truyền `table.qrToken` gián tiếp qua `table` và làm mới dữ liệu sau success.
- [ ] Step 4: Đổi drawer mobile thành `inset-x-0 bottom-0 max-h-[92dvh] rounded-t-2xl`, desktop giữ panel bên phải; đảm bảo danh sách đơn cuộn riêng.
- [ ] Step 5: Chạy test/typecheck và commit `feat: enable table payment from staff drawer`.

- [x] Task 3: Tạo shell điều hướng mobile staff và ẩn khu pha chế trên mobile

**Files:**
- Create: `chalo-fe/src/app/(staff)/_components/MobileStaffNav.tsx`
- Modify: `chalo-fe/src/app/(staff)/layout.tsx`
- Modify: `chalo-fe/src/app/(staff)/_components/SplitPane.tsx`
- Reuse/reference: `chalo-fe/src/app/(admin)/_components/MobileAdminNav.tsx`, `chalo-fe/src/app/(staff)/staff/_components/header.config.ts`
- Test: `chalo-fe/e2e/staff-mobile.spec.ts`

**Interfaces:**
- `MobileStaffNav` nhận danh sách nav staff và render bottom bar fixed trên `<md`, active theo pathname, có safe-area padding.
- `SplitPane` giữ right/prep mounted cho desktop nhưng mobile chỉ render left/main; không còn tab khu pha chế mobile.

- [ ] Step 1: Viết E2E skeleton kiểm tra viewport 375x667 có đúng ba mục và không có text `Khu pha chế`.
- [ ] Step 2: Implement bottom nav với vùng chạm >=44px, z-index/padding không che nội dung, link Đơn hàng/POS/Bàn.
- [ ] Step 3: Điều chỉnh layout staff để main có `padding-bottom` tương ứng và SplitPane không chiếm vùng prep trên mobile.
- [ ] Step 4: Chạy typecheck và kiểm tra route switching bằng test mock.
- [ ] Step 5: Commit `feat: add mobile staff navigation shell`.

- [x] Task 4: Tối ưu màn Đơn hàng cho mobile

**Files:**
- Modify: `chalo-fe/src/app/(staff)/staff/orders/page.tsx`
- Modify: `chalo-fe/src/app/(staff)/staff/orders/_components/KanbanColumn.tsx`
- Create if needed: `chalo-fe/src/app/(staff)/staff/orders/_components/MobileOrderStatusTabs.tsx`
- Test: `chalo-fe/e2e/staff-mobile.spec.ts`

- [ ] Step 1: Chọn dữ liệu cột hiện có làm nguồn duy nhất, thêm state tab trạng thái mobile mặc định `PENDING`.
- [ ] Step 2: Render tab ngang có badge số đơn và chỉ một danh sách cột trên mobile; desktop giữ kanban nhiều cột.
- [ ] Step 3: Co search/live/refresh thành hàng điều khiển không tràn; giữ SSE, âm báo và thao tác mở order detail.
- [ ] Step 4: Kiểm tra Playwright mobile: đổi tab, tìm bàn, mở chi tiết và đóng modal.
- [ ] Step 5: Chạy test/typecheck và commit `feat: optimize staff orders for mobile`.

- [x] Task 5: Đổi POS mobile sang giỏ hàng bottom sheet

**Files:**
- Modify: `chalo-fe/src/app/(staff)/staff/pos/page.tsx`
- Modify: `chalo-fe/src/app/(staff)/staff/pos/_components/CartItem.tsx`
- Create if needed: `chalo-fe/src/app/(staff)/staff/pos/_components/MobileCartSheet.tsx`
- Test: `chalo-fe/e2e/staff-mobile.spec.ts`

- [ ] Step 1: Giữ product grid chiếm chiều cao chính trên mobile và thêm nút nổi/fixed `Giỏ hàng` có số món/tổng tiền.
- [ ] Step 2: Đưa panel đơn hiện tại vào sheet mobile; sheet giữ chọn bàn, thẻ bàn, ghi chú, xoá giỏ và tạo đơn.
- [ ] Step 3: Đảm bảo sheet đóng/mở không làm mất state cart, scroll nội dung độc lập và không bị bottom nav che.
- [ ] Step 4: Desktop giữ hai cột hiện tại; mobile test thêm món, mở sheet và tạo đơn với API mock.
- [ ] Step 5: Chạy typecheck/test và commit `feat: use bottom sheet cart on mobile pos`.

- [x] Task 6: Tối ưu màn Bàn và hoàn thiện kiểm thử giao diện

**Files:**
- Modify: `chalo-fe/src/app/(staff)/staff/tables/page.tsx`
- Modify: `chalo-fe/src/app/(staff)/staff/tables/_components/TableCard.tsx`
- Modify: `chalo-fe/src/app/(staff)/staff/tables/_components/TableDrawer.tsx`
- Modify: `chalo-fe/e2e/staff-mobile.spec.ts`
- Create: `chalo-fe/e2e/staff-table-payment.spec.ts` nếu tách test thanh toán

- [ ] Step 1: Chỉnh grid mobile 2 cột, card có kích thước/vùng chạm rõ và header/filter cuộn ngang không tràn.
- [ ] Step 2: Playwright mobile kiểm tra mở bàn, xem đơn, mở popup payment và đổi QR/tiền mặt.
- [ ] Step 3: Playwright desktop kiểm tra popup QR có `data-testid="vietqr-code"`, popup tiền mặt tính tiền thừa và xác nhận gọi pay-all.
- [ ] Step 4: Chạy `pnpm exec tsc --noEmit`, unit tests frontend và E2E khả dụng; ghi rõ test bị chặn do thiếu browser dependency nếu có.
- [ ] Step 5: Đọc diff, cập nhật checkbox từng task đã hoàn thành, viết summary tại `docs/superpowers/summaries/2026-08-11-staff-mobile-and-table-payment-summary.md` gồm 4 mục bắt buộc và liên kết ngược spec/plan.
- [ ] Step 6: Commit `test: verify staff mobile and table payment flows`.

## Kết quả

[Summary thực thi](../summaries/2026-08-11-staff-mobile-and-table-payment-summary.md)
