# Điều hướng trang chủ theo role đã đăng nhập

## Mục tiêu

Khi người dùng đã có phiên đăng nhập hợp lệ mở `chalocoffee.com` (route `/`), ứng dụng phải chuyển thẳng đến khu vực làm việc phù hợp, thay vì hiển thị landing page công khai.

## Hành vi

| Trạng thái | Kết quả khi mở `/` |
| --- | --- |
| Chưa có access token | Hiển thị landing page như hiện tại |
| `CUSTOMER` có token | Chuyển đến `/account` |
| `MODERATOR` có token | Chuyển đến `/staff/orders` |
| `ADMIN` có token | Chuyển đến `/admin/dashboard` |
| Có token nhưng role không có đích hợp lệ | Giữ tại landing page; không tự cấp hoặc đoán quyền |

## Thiết kế kỹ thuật

`middleware.ts` là điểm quyết định điều hướng vì nó chạy trước khi React render. Route `/` sẽ dùng cùng điều kiện cookie `ACCESS_TOKEN` + `USER_ROLE` và cùng map `ROLE_DEFAULT_ROUTES` mà các route công khai hiện có đang dùng.

Không thay đổi landing component, auth store, cấu trúc route hoặc các rule bảo vệ `/account`, `/staff/*`, `/admin/*`. Nhờ đó không có flash landing page và một nguồn duy nhất tiếp tục định nghĩa màn mặc định của từng role.

## Kiểm chứng

Thêm kiểm thử trình duyệt cho request đầu tiên đến `/` với cookie xác thực của `ADMIN`, `MODERATOR`, `CUSTOMER`, đồng thời kiểm tra khách chưa đăng nhập vẫn thấy landing page. Các test sẽ xác nhận URL đích thay vì dựa vào client-side state.

Kiểm UI bằng Playwright trên desktop và viewport 375×667: diễn lại việc mở `/` với từng role, xác nhận không có console error hoặc HTTP 4xx/5xx ngoài EventSource SSE đã được recipe dự án cho phép loại trừ có chủ đích.

## Ngoài phạm vi

- Thay đổi đích mặc định hiện tại của từng role.
- Ép người dùng đã đăng nhập rời khỏi link menu/bàn cụ thể họ mở trực tiếp.
- Thay đổi quyền truy cập backend.

## Plan thực thi

Sẽ liên kết tới `../plans/2026-08-17-role-home-redirect.md` sau khi plan được tạo.
