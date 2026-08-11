# Đăng xuất trên staff mobile

## Mục tiêu

Cho nhân viên đăng xuất trực tiếp từ thanh điều hướng đáy trên màn hình điện thoại, để phiên làm việc không bị giữ lại khi đổi người dùng.

## Thiết kế

`MobileStaffNav` hiện có ba tab điều hướng. Thêm tab thứ tư `Đăng xuất` ở cuối thanh đáy, sử dụng `LogoutIcon` và màu đỏ để phân biệt với điều hướng thông thường. Grid đổi từ ba sang bốn cột nhưng vẫn chỉ hiển thị ở breakpoint mobile.

Khi bấm, tab gọi `useLogout` hiện có. Hook này gửi yêu cầu logout theo khả năng, xoá token/cookie/state và hard-navigate về `/login`; không tạo API, state hay luồng xác thực mới.

## Phạm vi và kiểm chứng

- Không thay đổi thanh sidebar/desktop, quyền staff hay route.
- Kiểm thử component/luồng ở viewport 375×667: thấy nút, bấm đăng xuất và được chuyển về `/login`.
- Kiểm tra không có overflow ngang, lỗi console hay request 4xx/5xx ngoài logout dự kiến.

## Plan thực thi

Xem [plan triển khai](../plans/2026-08-11-mobile-staff-logout.md).
