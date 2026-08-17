# Thiết kế: nhật ký hoạt động admin

## Mục tiêu

Cho admin một nơi tập trung để tra cứu các thao tác nhạy cảm đã được ghi nhận: hoàn tiền, nhập/điều chỉnh kho, thay công thức và cài đặt.

## Quyết định

- Thêm trang Admin-only `/admin/audit` sử dụng API audit read-only hiện có, lấy tối đa 50 entry mới nhất.
- Hiển thị thời điểm, người thực hiện (ID nếu log lịch sử không có hồ sơ), loại hành động, đối tượng và metadata có nhãn Việt hoá; lọc client-side theo hành động.
- Không có tạo/sửa/xóa, export, pagination, quyền mới hay thay đổi schema. Trạng thái tải/rỗng/lỗi đều độc lập.
- Điều hướng desktop và mục Khác trên mobile đều có link tới trang mới.

## Kiểm chứng

- Playwright mock API xác minh item, filter, error/retry và không tràn ngang ở 375×667.

## Plan thực thi

[Kế hoạch thực thi](../plans/2026-08-17-audit-log-console.md)
