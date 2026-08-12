# Kết quả: Xóa đơn trên Admin

Spec: [admin-order-delete-design.md](../specs/2026-08-12-admin-order-delete-design.md)  
Plan: [admin-order-delete.md](../plans/2026-08-12-admin-order-delete.md)

## Đã làm gì

- Admin có thể xóa vĩnh viễn mọi đơn, gồm cả đơn đã thanh toán, bằng endpoint chỉ dành cho role Admin.
- Khi xóa, hệ thống dọn món, điểm tích lũy và allocation thanh toán; giao dịch thanh toán đơn lẻ bị xóa, giao dịch gộp được giảm đúng phần tiền của đơn vừa xóa.
- Trạng thái bàn và pager được đồng bộ sau khi xóa; các trang dữ liệu đơn, bàn, doanh thu và chốt ca tự tải lại.
- Trang Admin/Đơn hàng có action Xóa ở desktop lẫn mobile cùng bước xác nhận không thể hoàn tác.

## File chính

- `chalo-be/src/modules/order/order.service.ts`: transaction xóa đơn và dữ liệu phụ thuộc.
- `chalo-be/src/modules/order/order.controller.ts`: API `DELETE /order/:id` Admin-only.
- `chalo-be/src/modules/order/order.service.delete.spec.ts`: kiểm thử dọn dữ liệu của đơn đã thanh toán.
- `chalo-fe/src/app/(admin)/admin/orders/page.tsx`: nút và modal xác nhận xóa.
- `chalo-fe/src/services/order/order.api.ts`: wrapper gọi API xóa.
- `chalo-fe/src/services/order/order.queries.ts`: mutation và làm mới cache liên quan.

## Khác với plan

- Không có test hook frontend độc lập vì bộ test frontend hiện chỉ dùng Node test cho các utility; build TypeScript bao phủ liên kết API/hook. Playwright không chạy được do dev server riêng không giữ được cổng trong môi trường có nhiều server/watchers đang hoạt động.

## Còn dở / cần lưu ý

- Chưa làm phần sửa nội dung đơn; đây là checkpoint tiếp theo.
- Xóa là vĩnh viễn theo yêu cầu để dọn dữ liệu test; không có undo hoặc audit log hoàn tiền.
