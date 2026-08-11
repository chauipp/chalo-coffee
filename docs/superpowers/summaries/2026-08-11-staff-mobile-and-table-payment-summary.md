# Tổng kết: staff mobile và thanh toán tại bàn

Spec: [staff mobile và thanh toán tại bàn](../specs/2026-08-11-staff-mobile-and-table-payment-design.md) · Plan: [kế hoạch triển khai](../plans/2026-08-11-staff-mobile-and-table-payment.md)

## Đã làm gì

- Staff trên mobile có thanh điều hướng dưới cho Đơn hàng, POS và Bàn; khu pha chế chỉ còn hoạt động trên desktop.
- Màn Đơn hàng chuyển sang xem theo tab trạng thái ở mobile, tránh kanban ngang bị tràn.
- POS mobile dùng giỏ hàng dạng bottom sheet; chọn món vẫn có toàn bộ không gian màn hình.
- Màn Bàn dùng drawer phù hợp mobile, chỉ còn hiển thị tổng chưa thanh toán; thao tác thanh toán được đưa về đúng modal chi tiết đơn.
- Từ modal chi tiết, nút `Thanh toán` mở bước cùng modal với toggle `Đơn này`/`Cả bàn`, VietQR hoặc tiền mặt, tính tiền thừa và chỉ xác nhận khi nhận đủ tiền.
- Bỏ `In tạm tính`, giữ `In hoá đơn`; sau thanh toán, dữ liệu đơn và danh sách bàn được làm mới.
- Bổ sung mock checkout preview và E2E kiểm tra QR, tiền thừa, payload `/order/pay`/`/order/pay-all` cùng kích thước mobile 375px.

## File chính

- `chalo-fe/src/app/(staff)/_components/MobileStaffNav.tsx`: thanh điều hướng mobile cho ba luồng staff.
- `chalo-fe/src/app/(staff)/staff/orders/_components/OrderPaymentPanel.tsx`: bước chọn phạm vi, phương thức và xác nhận thanh toán trong modal đơn.
- `chalo-fe/src/app/(staff)/staff/orders/@modal/(.)orders/[orderId]/page.tsx`: chuyển giữa chi tiết đơn và bước thanh toán, không tạo popup lồng nhau.
- `chalo-fe/src/app/(staff)/staff/orders/_components/payment.utils.ts`: kiểm tra tiền khách đưa và tính tiền thừa thuần để test độc lập.
- `chalo-fe/src/app/(staff)/staff/pos/page.tsx`: giỏ hàng mobile dạng bottom sheet.
- `chalo-fe/src/app/(staff)/staff/orders/page.tsx`: tab trạng thái đơn hàng trên mobile.
- `chalo-fe/e2e/staff-table-payment.spec.ts`: kiểm tra end-to-end payment table độc lập backend.

## Khác với plan

- Thanh toán từng được đặt ở drawer của Bàn trong lần triển khai đầu; đã chuyển vào modal chi tiết đơn theo yêu cầu chốt sau đó. Trong lúc kiểm typecheck, `STATUS_CONFIG` được tách khỏi file page vì Next.js không cho export hằng phụ từ route page; hành vi UI giữ nguyên.

## Còn dở / cần lưu ý

- Không lưu phương thức thanh toán hoặc tiền khách đưa vào database theo đúng phạm vi đã duyệt.
- Chưa merge, push hoặc deploy VPS.
