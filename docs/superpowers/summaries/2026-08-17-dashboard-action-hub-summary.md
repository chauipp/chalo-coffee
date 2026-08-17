# Tổng kết: dashboard hành động nhanh

Liên quan: [thiết kế](../specs/2026-08-17-dashboard-action-hub-design.md) · [kế hoạch](../plans/2026-08-17-dashboard-action-hub.md)

## Đã làm gì

- Dashboard admin có khu Cần xử lý gồm đơn đang chạy, ca hiện tại và tồn kho cần nhập.
- Mỗi thẻ dẫn thẳng tới workspace thao tác tương ứng, có trạng thái tải và có nút tải lại riêng nếu một nguồn dữ liệu lỗi.
- Trên mobile, ba thẻ vẫn vừa khung 375px và không tạo cuộn ngang.
- Bổ sung cờ payment-requested tương thích ngược trong DTO frontend để hiển thị số yêu cầu thanh toán chính xác khi backend trả dữ liệu mới.

## File chính

- `chalo-fe/src/app/(admin)/admin/dashboard/_components/ActionHub.tsx` hiển thị ba hành động vận hành độc lập.
- `chalo-fe/src/app/(admin)/admin/dashboard/_components/actionHub.utils.ts` biến dữ liệu đơn/ca thành nội dung an toàn cho UI.
- `chalo-fe/src/app/(admin)/admin/dashboard/page.tsx` ghép các query hiện có vào dashboard.
- `chalo-fe/e2e/admin-dashboard-action-hub.spec.ts` kiểm desktop/mobile, link và retry của nguồn lỗi.

## Khác với plan

Không lệch. Cờ `paymentRequested` được khai báo optional vì các fixture frontend cũ chưa có trường này, trong khi API thật đã trả nó; dữ liệu thiếu được hiểu là chưa yêu cầu thanh toán.

## Còn dở / cần lưu ý

Không. Đây là dashboard tổng hợp read-only; thao tác vẫn diễn ra ở các workspace chuyên biệt.
