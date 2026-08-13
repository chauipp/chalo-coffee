Spec: `../specs/2026-08-13-admin-user-management-design.md` · Plan: `../plans/2026-08-13-admin-user-management.md`

# Màn admin quản lý người dùng (nhân viên + khách hàng) — Summary

## Đã làm gì

- Admin vào `/admin/users` (route mới thay `/admin/staff`, sidebar đổi label "Nhân viên" → "Người dùng") thấy 1 trang có 2 tab: "Nhân viên" (mặc định, giữ nguyên 100% hành vi cũ: tạo/sửa/đổi mật khẩu/khoá/xoá) và "Khách hàng" (mới).
- Tab Khách hàng: xem toàn bộ danh sách tài khoản khách (tên, username, email, trạng thái, ngày tạo), tìm theo tên/tài khoản, khoá/mở khoá tài khoản ngay trên hàng (bảng desktop) hoặc trên card (mobile) — badge đổi ngay không cần reload.
- Bấm "Xem" 1 khách hàng mở modal chi tiết: thấy điểm tích luỹ và lịch sử đơn hàng (bảng rút gọn desktop / list card mobile, có phân trang riêng trong modal), kèm trạng thái rỗng khi khách chưa có đơn.
- Responsive mobile chuẩn cho cả 2 tab: tab bar dạng segment control full-width, card thay bảng, không tràn ngang — đã verify tận mắt bằng Playwright MCP ở viewport 390x844.
- Không cho admin tạo/sửa/đổi mật khẩu/xoá tài khoản khách hàng — đúng theo out-of-scope của spec, chỉ có xem + khoá/mở khoá.
- Sau review toàn nhánh: sửa placeholder ô tìm khách hàng cho khớp thật với BE (bỏ chữ "email" gây hiểu nhầm), thêm `ParseIntPipe` cho 3 endpoint admin mới để trả lỗi 400 sạch khi `:id` không hợp lệ (thay vì 500 từ Postgres), dọn 1 query key thừa không ai dùng.

## File chính

- `chalo-be/src/modules/user/user.service.ts` — thêm `setActive(id, isActive, requesterId)`: khoá/mở khoá tài khoản, 404 nếu không tìm thấy, 403 nếu tự khoá chính mình.
- `chalo-be/src/modules/user/user.controller.ts` — thêm 3 route ADMIN-only: `GET :id/orders`, `GET :id/loyalty` (gọi lại `CustomerService`), `PUT :id/active` (gọi `setActive`); cả 3 param `:id` dùng `ParseIntPipe`.
- `chalo-be/src/modules/user/user.module.ts` — import `CustomerModule` để `UserController` inject được `CustomerService`.
- `chalo-be/src/modules/user/dto/set-active.dto.ts` — DTO body `{isActive: boolean}` cho endpoint khoá/mở khoá.
- `chalo-fe/src/services/customer-admin/*` (`customer-admin.types.ts`, `customer-admin.api.ts`, `customer-admin.queries.ts`, `index.ts`) — module tách biệt hoàn toàn khỏi `services/user`, chứa `CustomerDto`, `getCustomerPage`, `getCustomerOrders`, `useGetCustomerLoyalty`, `useSetCustomerActive`.
- `chalo-fe/src/app/(admin)/admin/users/page.tsx` — trang mới, tab switch bằng state cục bộ giữa `StaffTab`/`CustomerTab`.
- `chalo-fe/src/app/(admin)/admin/users/_components/StaffTab.tsx` — nội dung cũ của `admin/staff/page.tsx`, tách thành component riêng, hành vi không đổi.
- `chalo-fe/src/app/(admin)/admin/users/_components/CustomerTab.tsx` — danh sách khách hàng, tìm kiếm, toggle khoá/mở khoá, mở modal chi tiết.
- `chalo-fe/src/app/(admin)/admin/users/_components/CustomerDetailContent.tsx` — nội dung modal chi tiết: thông tin cơ bản, điểm tích luỹ, lịch sử đơn hàng có phân trang.
- `chalo-fe/src/components/shared/ui/Toggle.tsx` — thêm prop optional `testId` để test target đúng toggle giữa nhiều hàng.
- `chalo-fe/e2e/admin-users-customers.spec.ts` — e2e desktop: tạo khách hàng thật qua `/register`, admin xem/khoá/mở khoá.
- `chalo-fe/e2e/admin-mobile.spec.ts` — cập nhật path `/admin/staff` → `/admin/users`; test mobile cho tab Khách hàng **chưa được thêm** (xem "Khác với plan").
- `chalo-fe/src/constants/routes.ts` — `ADMIN.STAFF` → `ADMIN.USERS`.
- `chalo-fe/src/app/(admin)/_components/sidebar.config.ts` — label "Nhân viên" → "Người dùng", href/overflow theo route mới.

## Khác với plan

- Task 8 (e2e mobile tự động cho tab Khách hàng) không thực thi — quyết định của người dùng do máy dev thiếu system dependency cho WebKit (`npx playwright install-deps webkit` cần sudo, không có trong phiên làm việc). Verify mobile thay bằng Playwright MCP thủ công: resize 390x844, xác nhận tab bar segment control, card, toggle, modal chi tiết đều đúng layout và không tràn ngang; khoá/mở khoá live-update không cần reload.
- Khoá/mở khoá tài khoản nhân viên (tab Nhân viên) vẫn đi qua `UserService.update()` như cũ; khoá/mở khoá khách hàng (tab Khách hàng) đi qua `UserService.setActive()` mới — đây là 2 đường CÓ CHỦ ĐÍCH khác nhau (`update()` cố tình chặn mọi thay đổi lên CUSTOMER để giữ bug fix trước, nên cần 1 đường riêng cho khách hàng), không phải thiếu nhất quán.
- `setActive()` được viết dùng chung được cho cả CUSTOMER và ADMIN/MODERATOR (không giới hạn theo role), dù hiện tại chỉ có UI tab Khách hàng gọi tới nó.
- `CustomerPageParams` (FE) không có field `isActive` filter như spec ban đầu nêu — bỏ vì UI không có ô lọc trạng thái riêng cho khách hàng (chỉ có ô tìm tên/tài khoản), là rút gọn có chủ đích, không phải thiếu sót.
- Có gặp trở ngại hạ tầng: Postgres dev cục bộ (port 5433 mặc định) bị dự án khác trên cùng máy chiếm, phải dựng lại tạm ở port 5434 (dùng volume dữ liệu thật `chalo-be_pgdata`, chạy thêm 3 migration còn thiếu) để verify e2e được — không ảnh hưởng gì tới code hay dữ liệu production.

## Còn dở / cần lưu ý

- Test e2e mobile tự động cho tab Khách hàng (`admin-mobile.spec.ts`) chưa có — cần cài `sudo npx playwright install-deps webkit` trên máy dev rồi viết bổ sung sau nếu muốn có regression net tự động cho mobile.
- 3 endpoint mới (`GET /user/:id/orders`, `GET /user/:id/loyalty`, `PUT /user/:id/active`) dùng blacklist `toDto()` (loại password/refresh-token) chứ không whitelist — khách hàng hiện lộ `googleSubject`/`email` qua response `/user/page?role=CUSTOMER` (không phải credential, chỉ admin xem được, nhưng ghi nhận ở đây để ai cần whitelist hoá sau thì biết).
- `GET /user/:id/loyalty` trả `{balance: 0}` cho id không tồn tại thay vì 404 (hành vi có sẵn từ `CustomerService.getLoyalty`, không sửa trong nhánh này).
- Map nhãn trạng thái đơn hàng (`STATUS_BADGE`) trong `CustomerDetailContent.tsx` là copy nguyên văn từ `admin/orders/page.tsx` — nên tách thành util chung (`@/utils/order-status-badge`, theo mẫu `@/utils/user-role-label` đã có) ở lần sửa sau để tránh lệch nhãn.
