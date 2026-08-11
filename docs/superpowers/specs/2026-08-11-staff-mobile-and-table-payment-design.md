# Staff mobile và thanh toán tại bàn

## Mục tiêu

Làm responsive mobile hoàn chỉnh cho ba màn staff: Đơn hàng, POS và Bàn; đồng thời bổ sung luồng thanh toán gộp tại bàn trên cả PC và mobile. Khu pha chế giữ nguyên trên desktop nhưng tạm thời không đưa vào luồng mobile.

## Phạm vi giao diện

- Mobile staff có điều hướng cố định phía dưới với ba mục Đơn hàng, POS và Bàn.
- Màn Đơn hàng dùng bộ lọc/tab trạng thái để xem từng nhóm đơn theo chiều dọc, tránh kanban phải kéo ngang trên màn hình hẹp. Tìm bàn, trạng thái live, làm mới và mở chi tiết đơn vẫn giữ được.
- Màn POS giữ vùng chọn món làm vùng chính; giỏ hàng mở bằng bottom sheet khi nhân viên cần xem/chỉnh giỏ hoặc tạo đơn. Sheet có chọn bàn, thẻ bàn, ghi chú và nút tạo đơn.
- Màn Bàn hiển thị lưới 2 cột trên mobile. Chạm vào bàn mở drawer/sheet chi tiết phù hợp chiều rộng màn hình; desktop giữ drawer bên phải hiện tại.
- Khu pha chế không xuất hiện trong điều hướng mobile và không thay đổi hành vi desktop.

## Thanh toán từ chi tiết đơn

Nhân viên mở modal chi tiết đơn và bấm `Thanh toán`. Modal chuyển sang bước thanh toán trong cùng lớp giao diện, không mở popup chồng lên modal chi tiết. Đầu bước thanh toán có toggle:

- `Đơn này` là mặc định, thanh toán đúng đơn đang xem.
- `Cả bàn` gộp toàn bộ đơn chưa thanh toán của bàn chứa đơn đó.

Với cả hai lựa chọn, tổng tiền đổi theo phạm vi và nhân viên chọn một trong hai phương thức:

1. `QR chuyển khoản`: tạo VietQR động theo tổng tiền và thông tin ngân hàng đang cấu hình. Nhân viên/khách quét mã, sau đó nhân viên bấm xác nhận đã nhận tiền. Nếu chưa có cấu hình ngân hàng, hiển thị trạng thái hướng dẫn cấu hình thay vì QR rỗng.
2. `Tiền mặt`: nhân viên nhập số tiền khách đưa. Giao diện tính tiền thừa theo thời gian thực; chỉ cho xác nhận khi số tiền đưa không nhỏ hơn tổng tiền.
3. Khi xác nhận, `Đơn này` gọi API thanh toán một đơn; `Cả bàn` gọi API thanh toán gộp. Modal đóng sau khi thành công, dữ liệu đơn/bàn cập nhật lại và lỗi API giữ bước thanh toán mở để thử lại.

Nút `In tạm tính` bị xoá. Nút in hoá đơn chính thức vẫn giữ nguyên.

Không mở rộng schema hay lưu phương thức thanh toán/tiền khách đưa trong đợt này; các dữ liệu đó chỉ phục vụ thao tác tại quầy.

## Kiến trúc và dữ liệu

- Tái sử dụng query/mutation thanh toán một đơn, thanh toán gộp và helper `buildVietQR`/cấu hình ngân hàng hiện có.
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
- Playwright kiểm tra trực tiếp ở viewport mobile: chuyển ba tab, mở giỏ POS, mở chi tiết đơn, đổi toggle Đơn này/Cả bàn và hoàn tất hai phương thức thanh toán (mock API nếu cần).
- Playwright kiểm tra desktop: mở chi tiết đơn, chọn QR thấy mã QR; chọn tiền mặt thấy ô nhập và tiền thừa.
- Chạy typecheck và các test liên quan trước khi báo hoàn tất; không tự merge, push hoặc deploy.

## Plan thực thi

[Kế hoạch triển khai](../plans/2026-08-11-staff-mobile-and-table-payment.md)
