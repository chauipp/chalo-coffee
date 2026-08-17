# Thiết kế: dashboard hành động nhanh

## Mục tiêu

Giúp admin nhìn ra các việc cần xử lý ngay khi mở dashboard, thay vì phải tự lần lượt vào Đơn hàng, Ca làm và Tồn kho.

## Phương án được chọn

Thêm một nhóm ba thẻ dẫn hướng ở đầu dashboard, dùng hoàn toàn dữ liệu đã có:

- Đơn đang xử lý: lấy queue active, hiển thị tổng số và số đơn đã yêu cầu thanh toán, dẫn đến `/admin/orders`.
- Ca hiện tại: lấy `shift/current`, hiển thị trạng thái mở/chưa mở và thời gian bắt đầu, dẫn đến `/admin/shift`.
- Tồn kho: tái dùng cảnh báo low-stock hiện có, dẫn đến `/admin/inventory`.

Mỗi nguồn query độc lập. Khi một nguồn chưa tải hoặc lỗi, thẻ của nguồn đó vẫn nêu rõ trạng thái và cho phép tải lại; biểu đồ doanh thu và các thẻ khác không bị ảnh hưởng.

## Không làm

- Không thêm quyền, API, schema hay notification/push mới.
- Không tự động chuyển trạng thái đơn hoặc ca từ dashboard.
- Không đưa dữ liệu doanh thu mới ra ngoài phạm vi bộ lọc hiện có.

## Trải nghiệm và accessibility

- Cả thẻ là link có label rõ và đủ vùng bấm tối thiểu 44px.
- Desktop đặt ba thẻ thành hàng; mobile xếp một cột, không tạo scroll ngang hay che bởi navigation cố định.
- Thẻ dùng văn bản trạng thái, không chỉ màu sắc.

## Kiểm chứng

- Unit test phân loại đơn active/payment-requested và nội dung thẻ ca.
- Playwright mock API kiểm dashboard desktop/mobile, link đích, loading/error không chặn phần còn lại, không có console/network error không chủ ý.

## Plan thực thi

[Kế hoạch thực thi](../plans/2026-08-17-dashboard-action-hub.md)
