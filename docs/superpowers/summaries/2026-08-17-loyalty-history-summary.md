# Tổng kết: lịch sử tích điểm khách hàng

Liên quan: [thiết kế](../specs/2026-08-17-loyalty-history-design.md) · [kế hoạch](../plans/2026-08-17-loyalty-history.md)

## Đã làm gì

- Khách đã đăng nhập có thể mở lịch sử điểm theo từng đơn đã thanh toán ngay dưới thẻ Điểm Chalo; chỉ tải dữ liệu khi họ mở mục này.
- Mỗi dòng cho biết mã đơn, thời điểm, tổng tiền đơn và số điểm được cộng; có đủ trạng thái đang tải, rỗng, lỗi và tải lại.
- Admin xem được năm lần cộng điểm gần nhất trong chi tiết khách hàng để hỗ trợ đối chiếu.
- API ledger giới hạn theo đúng khách hàng đang đăng nhập, phân trang 1–50 bản ghi và join thông tin đơn hàng trong cùng query.
- Browser test xác nhận thao tác mở/đóng ở desktop và mobile không làm tràn ngang, không có console/network error không chủ ý.

## File chính

- `chalo-be/src/modules/customer/customer.service.ts` trả sổ cái điểm ownership-scoped cùng tổng tiền đơn.
- `chalo-be/src/modules/customer/customer.controller.ts` và `user.controller.ts` công bố endpoint khách/admin read-only.
- `chalo-fe/src/app/(customer)/account/_components/LoyaltyHistoryCard.tsx` hiển thị disclosure card thân thiện trên mobile.
- `chalo-fe/src/app/(admin)/admin/users/_components/CustomerDetailContent.tsx` hiển thị các entry mới nhất cho admin.
- `chalo-fe/e2e/customer-account.spec.ts` kiểm luồng lịch sử loyalty và fixture phiên HttpOnly hiện hành.

## Khác với plan

Không lệch. Fixture browser cũ được cập nhật từ cookie token dạng JS sang `chalo_access` HttpOnly để test thực sự đi qua middleware đăng nhập hiện hành.

## Còn dở / cần lưu ý

Không. Tính năng chỉ là đối chiếu read-only: không tạo quy đổi điểm, giảm giá hay giá trị tiền tệ.
