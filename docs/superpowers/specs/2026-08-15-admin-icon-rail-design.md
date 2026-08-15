# Rail icon khu pha chế cho admin

## Mục tiêu

Thay rail chữ `Pha chế` ở mép phải của toàn bộ màn admin desktop bằng một thanh icon dọc, theo cách hoạt động quen thuộc của Edge sidebar. Hiện chỉ có một mục: khu pha chế.

## Thiết kế

- `AdminPrepSidebarLayout` tiếp tục sở hữu trạng thái mở/đóng và giữ khoá localStorage hiện có, nên trạng thái mở dock không đổi sau khi tải lại trang.
- Rail luôn nằm ở mép phải mọi route `/admin/*` trên desktop. Rail có chiều rộng cố định, nền cùng hệ thống admin, ngăn cách với nội dung bằng đường viền trái.
- Rail nhận một danh sách action nội bộ. Bản đầu danh sách chỉ gồm action `Pha chế`, dùng icon cà phê, tooltip/aria-label `Khu pha chế`.
- Bấm icon mở hoặc đóng `PrepDock`. Khi đang mở, icon mang trạng thái active và vẫn ở vị trí cũ trong rail.
- Header `PrepStation` không có điều khiển phóng to, thu nhỏ hoặc đóng; rail là điểm điều khiển duy nhất của dock.
- Không sửa hành vi mobile: rail và pane phụ tiếp tục ẩn dưới breakpoint desktop.

## Kiểm thử

- E2E xác nhận rail icon luôn hiện ở dashboard và orders, icon mở/đóng dock, và dock vẫn là pane cạnh nội dung.
- Typecheck, test unit hiện có và kiểm UI Playwright phải xanh.
