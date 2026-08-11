# Staff mobile và thanh toán tại bàn

## Mục tiêu

Làm responsive mobile hoàn chỉnh cho ba màn staff: Đơn hàng, POS và Bàn; đồng thời bổ sung luồng thanh toán gộp tại bàn trên cả PC và mobile. Khu pha chế giữ nguyên trên desktop nhưng tạm thời không đưa vào luồng mobile.

## Phạm vi giao diện

- Mobile staff có điều hướng cố định phía dưới với ba mục Đơn hàng, POS và Bàn.
- Màn Đơn hàng dùng bộ lọc/tab trạng thái để xem từng nhóm đơn theo chiều dọc, tránh kanban phải kéo ngang trên màn hình hẹp. Tìm bàn, trạng thái live, làm mới và mở chi tiết đơn vẫn giữ được.
- Màn POS giữ vùng chọn món làm vùng chính; giỏ hàng mở bằng bottom sheet khi nhân viên cần xem/chỉnh giỏ hoặc tạo đơn. Sheet có chọn bàn, thẻ bàn, ghi chú và nút tạo đơn.
- Màn Bàn hiển thị lưới 2 cột trên mobile. Chạm vào bàn mở drawer/sheet chi tiết phù hợp chiều rộng màn hình; desktop giữ drawer bên phải hiện tại.
- Khu pha chế không xuất hiện trong điều hướng mobile và không thay đổi hành vi desktop.

## Thanh toán gộp tại bàn

Chi tiết bàn có nút `Thanh toán` khi bàn có ít nhất một đơn chưa trả. Luồng thanh toán gộp toàn bộ đơn chưa thanh toán của bàn trong một lần.

1. Nhân viên mở hộp thanh toán và thấy tổng tiền cùng hai lựa chọn: `QR chuyển khoản` hoặc `Tiền mặt`.
2. Với QR, giao diện tạo VietQR động theo tổng tiền và thông tin ngân hàng đang cấu hình. Nhân viên/khách quét mã, sau đó nhân viên bấm xác nhận đã nhận tiền. Nếu chưa có cấu hình ngân hàng, hiển thị trạng thái hướng dẫn cấu hình thay vì QR rỗng.
3. Với tiền mặt, nhân viên nhập số tiền khách đưa. Giao diện tính tiền thừa theo thời gian thực; chỉ cho xác nhận khi số tiền đưa không nhỏ hơn tổng tiền. Có thể xoá/chỉnh số tiền trước khi xác nhận.
4. Khi xác nhận, gọi API thanh toán gộp hiện có cho `tableToken`, đóng hộp, làm mới dữ liệu bàn/đơn và hiển thị thông báo thành công. Lỗi API giữ hộp mở để thử lại.

Không mở rộng schema hay lưu phương thức thanh toán/tiền khách đưa trong đợt này; các dữ liệu đó chỉ phục vụ thao tác tại quầy.

## Kiến trúc và dữ liệu

- Tái sử dụng query/mutation thanh toán gộp và helper `buildVietQR`/cấu hình ngân hàng hiện có.
- Tách phần chọn phương thức và tính tiền mặt thành component/pure helper nhỏ để kiểm thử độc lập.
- Invalidate danh sách bàn và đơn sau thanh toán để trạng thái `OCCUPIED`/`AVAILABLE`, tổng tiền và badge cập nhật ngay.
- Không thay đổi quyền staff hiện tại; endpoint thanh toán dùng cơ chế bảo vệ sẵn có.

## Xử lý lỗi và khả năng dùng

- Nút và vùng chạm mobile tối thiểu khoảng 44px.
- Hộp thanh toán có thể đóng bằng nút đóng, chạm nền hoặc Escape trên desktop.
- Nút xác nhận có trạng thái loading và chống gửi lặp.
- Số tiền nhập tiền mặt chỉ chấp nhận số dương hợp lệ; định dạng tiền hiển thị theo `vi-VN`.
- QR luôn nằm trên nền trắng để ứng dụng ngân hàng quét được.

## Kiểm thử và nghiệm thu

- Unit test cho tính tiền thừa, tiền thiếu/bằng/đủ và dữ liệu nhập không hợp lệ.
- Test frontend cho chọn QR/tiền mặt, điều kiện hiển thị nút xác nhận và gọi thanh toán gộp.
- Playwright kiểm tra trực tiếp ở viewport mobile: chuyển ba tab, mở giỏ POS, mở chi tiết bàn và hoàn tất hai phương thức thanh toán (mock API nếu cần).
- Playwright kiểm tra desktop: mở chi tiết bàn, chọn QR thấy mã QR; chọn tiền mặt thấy ô nhập và tiền thừa.
- Chạy typecheck và các test liên quan trước khi báo hoàn tất; không tự merge, push hoặc deploy.

## Plan thực thi

[Kế hoạch triển khai](../plans/2026-08-11-staff-mobile-and-table-payment.md)
