# Nút đăng xuất cho mobile admin

## Tóm tắt yêu cầu

- Thêm nút `Đăng xuất` vào bottom sheet `Khác` của giao diện mobile admin.
- Nút gọi luồng logout sẵn có, xoá phiên ở client và chuyển tới `/login` bằng hard navigation.
- Giữ nguyên các liên kết `Nhân viên` và `Cài đặt`, thanh điều hướng nổi, giao diện tối và desktop.
- Đối tượng là quản trị viên dùng điện thoại.
- Không thay đổi API, quyền backend, hoặc dữ liệu đăng nhập.

## Giả định và yêu cầu phi chức năng

- Dùng `useLogout` vì hook này đã xử lý gọi API, xoá cookie/state và tránh cache điều hướng cũ.
- Thao tác logout không cần hộp xác nhận: có thể đăng nhập lại và phù hợp với menu hiện có.
- Nút phải có tên truy cập được bằng bàn phím/trình đọc màn hình và không làm che các mục điều hướng.
- Quy mô và hiệu năng không thay đổi đáng kể; chỉ thêm một handler phía client.

## Quyết định

1. Đặt nút sau danh sách liên kết trong sheet `Khác`, ngăn cách bằng đường kẻ; đây là vị trí ngữ nghĩa cho hành động tài khoản và không chiếm một trong năm tab chính.
2. Tái sử dụng `useLogout`, không gọi thẳng store/API, để giữ hành vi logout giống menu desktop.
3. Mở rộng Playwright mobile spec bằng luồng mở sheet → bấm logout → xác nhận `/login`.

## Plan thực thi

Xem [kế hoạch triển khai](../plans/2026-08-11-mobile-admin-logout.md).
