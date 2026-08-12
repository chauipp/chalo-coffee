# Kết quả: chốt ca, đối soát tiền và báo cáo

Spec: [thiết kế](../specs/2026-08-12-shift-reconciliation-reports-design.md) · Plan: [kế hoạch](../plans/2026-08-12-shift-reconciliation-reports.md)

## Đã làm gì

- Thêm sổ thanh toán bất biến: phân biệt tiền mặt, QR chuyển khoản, khách tự xác nhận và đơn lịch sử; lưu người thu, thời điểm thu, tiền khách đưa và tiền thừa.
- Bổ sung ca tiền mặt chung với tiền đầu ca, số tiền dự kiến, tiền thực đếm, chênh lệch và ghi chú bắt buộc khi lệch.
- Staff và admin có màn Chốt ca/Báo cáo responsive; xuất CSV UTF-8 và xem giao dịch gần đây.
- Panel thanh toán staff gửi phương thức và tiền khách đưa cho backend, không còn chỉ tính cục bộ.
- Kiểm qua Playwright desktop/mobile cho thanh toán và mở/chốt ca.

## File chính

- `chalo-be/src/modules/payment/`: ledger thanh toán và logic xác thực tiền thu.
- `chalo-be/src/modules/shift/`: API ca, đối soát và báo cáo.
- `chalo-be/src/migrations/1784365811593-ShiftReconciliation.ts`: schema, khóa bất biến và backfill paid order cũ.
- `chalo-fe/src/components/shift/ShiftWorkspace.tsx`: giao diện mở/chốt ca và CSV mobile-first.
- `chalo-fe/src/app/(staff)/staff/orders/_components/OrderPaymentPanel.tsx`: gửi cash/QR payload đầy đủ.

## Khác với plan

- Không tách riêng một trang report chỉ admin: `/admin/shift` tái sử dụng workspace chốt ca để staff/admin thao tác thống nhất và ít duplicate UI hơn.
- Checkout khách công khai được giữ tương thích nhưng đánh dấu `CUSTOMER_CONFIRMATION`, không gộp vào QR đã staff đối soát.

## Còn dở / cần lưu ý

- Chưa có luồng hoàn tiền/điều chỉnh giao dịch; đây sẽ là payment transaction bù ở phase sau.
- Migration production sẽ tự backfill đơn đã trả tiền thành `LEGACY`, vì dữ liệu cũ không có phương thức thu thực tế.
