# Xóa đơn trên Admin — Design

## Mục tiêu

Cho phép quản trị viên xóa vĩnh viễn mọi đơn thử nghiệm trên màn hình Admin, kể cả đơn đã thanh toán, để đơn không còn xuất hiện trong lịch sử, doanh thu hay báo cáo giao dịch.

## Phạm vi checkpoint 1

- Chỉ role `ADMIN` gọi được API xóa đơn.
- Nút **Xóa đơn** xuất hiện tại từng đơn trên cả bảng desktop và thẻ mobile của trang Admin/Đơn hàng.
- Trước khi xóa, giao diện hiện hộp xác nhận nêu rõ hành động không thể khôi phục.
- Backend khóa đơn trong transaction, sau đó xóa theo thứ tự: điểm tích lũy gắn với đơn, allocation thanh toán của đơn, món trong đơn, và bản ghi đơn.
- Nếu giao dịch thanh toán chỉ còn allocation của đơn bị xóa thì xóa luôn giao dịch. Nếu là thanh toán gộp nhiều đơn, chỉ giảm `totalAmount`, `receivedAmount` và `changeAmount` theo phần allocation bị xóa, giữ lại giao dịch cho các đơn còn lại.
- Nếu đơn đang gắn pager thì trả pager về trạng thái khả dụng và cập nhật trạng thái bàn sau khi xóa.
- Sau thành công, frontend làm mới danh sách đơn, đơn đang xử lý, bàn, doanh thu và dữ liệu ca.

## Ràng buộc dữ liệu

Xóa là xóa thật theo yêu cầu để dọn dữ liệu test. Vì vậy thao tác không thể hoàn tác. Xóa đơn đã trả tiền cũng xóa điểm thưởng của đơn; các báo cáo truy vấn transaction/allocation sẽ tự không còn tính khoản tiền tương ứng. Dữ liệu `expectedCash` đã chốt trong một ca cũ là snapshot nên không sửa ngược snapshot đó.

## Ngoài phạm vi checkpoint này

- Sửa nội dung đơn (món, số lượng, option, ghi chú) sẽ là checkpoint tiếp theo.
- Hoàn tiền có audit trail, phân quyền hai bước và điều chỉnh ca đã chốt không thuộc tính năng dọn đơn test này.

## Kiểm thử

- Unit test service cho đơn chưa thanh toán và đơn đã thanh toán riêng/gộp.
- Unit test UI/hook cho action xóa và invalidation dữ liệu.
- Build backend/frontend; mở UI Admin với Playwright nếu môi trường watcher cho phép.

## Plan thực thi

Xem [kế hoạch](../plans/2026-08-12-admin-order-delete.md).
