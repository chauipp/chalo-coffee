# Tổng kết: staff mobile và thanh toán tại bàn

Spec: [staff mobile và thanh toán tại bàn](../specs/2026-08-11-staff-mobile-and-table-payment-design.md) · Plan: [kế hoạch triển khai](../plans/2026-08-11-staff-mobile-and-table-payment.md)

## Đã làm gì

- Staff trên mobile có thanh điều hướng dưới cho Đơn hàng, POS và Bàn; khu pha chế chỉ còn hoạt động trên desktop.
- Màn Đơn hàng chuyển sang xem theo tab trạng thái ở mobile, tránh kanban ngang bị tràn.
- POS mobile dùng giỏ hàng dạng bottom sheet; chọn món vẫn có toàn bộ không gian màn hình.
- Màn Bàn dùng drawer phù hợp mobile và có nút thanh toán gộp các đơn chưa trả.
- Popup thanh toán cho chọn VietQR hoặc tiền mặt, tính tiền thừa và chỉ xác nhận khi nhận đủ tiền.
- Bổ sung mock cấu hình ngân hàng và E2E kiểm tra QR, tiền thừa và payload thanh toán gộp.

## File chính

- `chalo-fe/src/app/(staff)/_components/MobileStaffNav.tsx`: thanh điều hướng mobile cho ba luồng staff.
- `chalo-fe/src/app/(staff)/staff/tables/_components/TablePaymentModal.tsx`: popup QR/tiền mặt và xác nhận thanh toán.
- `chalo-fe/src/app/(staff)/staff/pos/page.tsx`: giỏ hàng mobile dạng bottom sheet.
- `chalo-fe/src/app/(staff)/staff/orders/page.tsx`: tab trạng thái đơn hàng trên mobile.
- `chalo-fe/e2e/staff-table-payment.spec.ts`: kiểm tra end-to-end payment table độc lập backend.

## Khác với plan

- Không lệch về chức năng. Trong lúc kiểm typecheck, `STATUS_CONFIG` được tách khỏi file page vì Next.js không cho export hằng phụ từ route page; hành vi UI giữ nguyên.

## Còn dở / cần lưu ý

- Không lưu phương thức thanh toán hoặc tiền khách đưa vào database theo đúng phạm vi đã duyệt.
- Chưa merge, push hoặc deploy VPS.
