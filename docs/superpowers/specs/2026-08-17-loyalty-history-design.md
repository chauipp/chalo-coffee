# Thiết kế: lịch sử tích điểm khách hàng

## Mục tiêu

Hiển thị cho khách lịch sử điểm theo từng đơn đã thanh toán để số dư loyalty có thể đối chiếu, đồng thời cho admin xem cùng dữ liệu khi hỗ trợ khách.

## Quyết định

- Không thêm đổi điểm, giảm giá hay giá trị tiền tệ; đây chỉ là sổ cái read-only của điểm đã cộng.
- API customer trả balance cùng danh sách `EARN` phân trang theo thời gian mới nhất. Không lộ dữ liệu khách khác.
- Mỗi entry hiển thị điểm, mã đơn rút gọn, tổng tiền đơn, thời điểm thanh toán. API lấy qua join Order, không N+1 query.
- Account page mở/đóng lịch sử bên dưới thẻ Điểm Chalo, có loading/empty/error/retry. Admin customer detail có số entry gần nhất.

## Kiểm chứng

- Jest kiểm quyền ownership, phân trang, total balance độc lập và mapping order summary.
- Playwright customer account desktop/mobile kiểm expand/collapse, empty và không có network/console error không chủ ý.

## Plan thực thi

[Kế hoạch thực thi](../plans/2026-08-17-loyalty-history.md)
