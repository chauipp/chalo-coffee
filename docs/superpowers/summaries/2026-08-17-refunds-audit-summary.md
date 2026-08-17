# Tổng kết: hoàn tiền và nhật ký vận hành

Liên quan: [spec](../specs/2026-08-17-refunds-audit-design.md) · [plan](../plans/2026-08-17-refunds-audit.md)

## Đã làm gì

- Admin ghi nhận hoàn tiền nội bộ với số tiền, phương thức và lý do bắt buộc; hệ thống khóa payment để không hoàn vượt số đã thu.
- Hoàn tiền tạo bút toán và audit log append-only; không gọi chuyển tiền ngân hàng tự động, không âm thầm đảo trạng thái đơn hoặc điểm thưởng.
- Báo cáo/chốt ca trừ refund tiền mặt, đồng thời hiển thị doanh thu gộp, tiền đã hoàn và doanh thu ròng.
- Chi tiết đơn admin có lịch sử hoàn tiền, nhật ký thao tác và bước xác nhận; staff không nhận được endpoint/action này.
- Bổ sung fixture browser desktop/mobile, kiểm console/network sạch và không tràn ngang.

## File chính

- `chalo-be/src/modules/payment/` chứa refund transaction, validation, API admin và khoá transaction.
- `chalo-be/src/modules/audit/` lưu/truy vấn audit log chỉ ghi thêm.
- `chalo-be/src/modules/shift/shift.service.ts` đối soát tiền ròng sau hoàn tiền.
- `chalo-fe/src/components/orders/RefundPanel.tsx` là UI hoàn tiền và audit tại chi tiết đơn.
- `chalo-fe/e2e/admin-order-detail.spec.ts` kiểm luồng hoàn tiền trên trình duyệt.

## Khác với plan

- Không cần chỉnh `deploy/README.md`: production đã tự chạy migration khi backend khởi động, không phát sinh biến cấu hình hay bước vận hành mới.

## Còn dở / cần lưu ý

- Hoàn tiền là bút toán nội bộ có kiểm soát; Admin phải thực hiện chi tiền/chuyển khoản thực tế bên ngoài hệ thống.
