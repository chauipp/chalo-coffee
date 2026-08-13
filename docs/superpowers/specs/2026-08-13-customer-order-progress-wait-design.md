# Thiết kế: Trạng thái trực quan và thời gian chờ theo đơn khách

## Mục tiêu

Hiển thị tiến trình đơn theo cách nói đúng trạng thái hiện tại, thay thế dòng
"Đang tiến hành…" chung chung. Bổ sung thời gian chờ dự kiến cho đúng từng
đơn, ở cả danh sách đơn của bàn và trang chi tiết đơn.

## Trạng thái phục vụ

Giữ bốn vị trí tiến trình hiện có: tiếp nhận, pha chế, phục vụ và hoàn tất.
Mỗi vị trí chỉ có một chỗ trong giao diện; nội dung tại chỗ đó đổi theo tiến
độ của đơn:

- `PENDING`: **Đang tiếp nhận** là bước hiện tại.
- Khi đơn đã qua tiếp nhận (`CONFIRMED` hoặc các trạng thái sau): **Đã tiếp
  nhận**.
- `PREPARING`: **Đang pha chế** là bước hiện tại; khi qua bước sau đổi thành
  **Đã pha chế**.
- `READY`: **Sẵn sàng phục vụ** là bước hiện tại; khi đơn hoàn tất đổi thành
  **Đã sẵn sàng phục vụ**.
- `COMPLETED`: **Đã phục vụ** là trạng thái hoàn tất cuối cùng.

Không tạo thêm bước riêng cho `CONFIRMED`: đây vẫn là trạng thái hoàn thành
của bước tiếp nhận. Vì chưa có pha chế, `CONFIRMED` không nhấn/animate một
bước tiếp theo giả định. `CANCELLED` tiếp tục hiển thị thông báo huỷ riêng và
không render tiến trình.

## Nhận diện bước hiện tại

Bỏ hoàn toàn cụm "Đang tiến hành…". Chỉ bước hiện tại có màu brand tương phản,
vòng nhấn và chấm báo hiệu nhấp nháy nhẹ (tôn trọng `prefers-reduced-motion`).
Bước đã xong dùng dấu tích và màu hoàn thành tĩnh; bước chưa tới giảm tương
phản. Khi `COMPLETED`, cả chuỗi ở trạng thái hoàn tất, không có animation.

## Thời gian chờ

Dùng trường API sẵn có `OrderDto.estimateWaitMinutes` theo từng đơn, không
tính lại hoặc dùng thời gian chờ chung của bàn.

- Trang **Đơn của bàn**: mỗi thẻ đơn chưa phục vụ/chưa huỷ có `estimateWaitMinutes > 0`
  hiển thị nhãn `Chờ dự kiến: ~N phút`.
- Trang **Chi tiết đơn**: giữ thẻ thời gian chờ của chính đơn đang xem, chuẩn
  hoá copy thành `Chờ dự kiến: ~N phút` để nhất quán với danh sách.
- Không hiển thị nhãn khi giá trị `null`, bằng 0, đơn đã phục vụ hoặc đã huỷ.

## Phạm vi và kiểm chứng

Chỉ sửa UI khách tại `src/app/(customer)/menu/[tableToken]/orders/` và test
liên quan; không đổi API, backend, cách tính ETA, hay trạng thái staff. Kiểm
trên browser desktop và 375×667 với dữ liệu mock cho các trạng thái PENDING,
PREPARING, READY, COMPLETED và CANCELLED; xác nhận animation chỉ xuất hiện ở
bước hiện tại, ETA đúng từng thẻ đơn, console/network sạch.

## Plan thực thi

[Xem plan thực thi](../plans/2026-08-13-customer-order-progress-wait.md).
