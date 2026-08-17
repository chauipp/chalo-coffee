# Thiết kế: hoàn tiền có kiểm soát và nhật ký vận hành

## Mục tiêu

Cho Admin ghi nhận hoàn tiền một cách kiểm soát được, không thể hoàn quá số đã thu, đồng thời tạo dấu vết tra cứu cho các thao tác vận hành nhạy cảm.

## Quyết định

- Hoàn tiền là ghi nhận nội bộ, không tự gọi API ngân hàng hay ví. Admin vẫn thực hiện chuyển tiền thực tế ngoài hệ thống.
- Chỉ `ADMIN` được tạo hoàn tiền. Mỗi lần bắt buộc số tiền dương và lý do; tổng refund trên một `PaymentTransaction` không vượt tổng tiền đã thu.
- `RefundTransaction` là append-only, mang payment, số tiền, phương thức hoàn, người thực hiện, lý do và thời điểm. Không có API sửa/xóa.
- Refund tiền mặt thuộc ca gốc nếu payment có `cashShiftId`; expected cash và báo cáo ca trừ phần refund này. Refund chuyển khoản chỉ giảm doanh thu ròng trong báo cáo.
- `AuditLog` ghi các hành động nhạy cảm hiện có của scope này: hoàn tiền, cập nhật recipe/tồn kho, và thay đổi cài đặt thanh toán. Chỉ admin đọc được.

## Luồng

1. Admin mở chi tiết payment/đơn đã thanh toán và nhập số tiền, phương thức trả lại, lý do.
2. Backend lock payment transaction, tổng hợp refunds đã tồn tại, từ chối nếu phần còn lại không đủ.
3. Backend lưu refund và audit trong một transaction; trả remaining refundable amount mới.
4. Báo cáo ca tính `gross`, `refunds` và `net`; chốt ca dùng tiền mặt net.
5. Admin xem lịch sử hoàn tiền và audit trong cùng ngữ cảnh, staff chỉ nhìn thấy trạng thái thanh toán hiện hữu.

## API và dữ liệu

- `POST /payment-transactions/:paymentId/refunds` (Admin): `{ amount, method, reason }`.
- `GET /payment-transactions/:paymentId/refunds` (Admin).
- `GET /audit-logs?entityType=&entityId=&limit=` (Admin).
- Payment DTO có `refundedAmount` và `refundableAmount`; shift report có `refunds` và `netRevenue`.

## An toàn và lỗi

- Validate integer VND `1..payment.totalAmount`, lý do 3–300 ký tự, method CASH/BANK_TRANSFER.
- Không đánh dấu order là unpaid và không xóa payment/loyalty: refund chỉ là bút toán tài chính để tránh đảo ngược âm thầm các trạng thái đã hoàn tất.
- Thiếu payment, payment legacy không hợp lệ, hoặc hoàn quá số còn lại trả 4xx có thông điệp rõ.
- UI hiển thị empty/loading/error; action có confirm trước khi ghi nhận.

## Kiểm chứng

- Jest: partial + multiple refunds, concurrent-style overspend check, cash shift net, role restriction và audit append-only.
- Playwright: Admin tạo refund hợp lệ, form sai bị chặn, lịch sử hiện đúng, desktop và 375×667 không tràn; console/network không có lỗi không chủ ý.

## Plan thực thi

[Kế hoạch thực thi](../plans/2026-08-17-refunds-audit.md)
