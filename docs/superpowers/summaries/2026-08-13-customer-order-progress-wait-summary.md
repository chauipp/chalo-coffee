# Kết quả: Trạng thái trực quan và thời gian chờ theo đơn khách

Liên quan: [spec](../specs/2026-08-13-customer-order-progress-wait-design.md) · [plan](../plans/2026-08-13-customer-order-progress-wait.md)

## Đã làm gì

- Bước hiện tại của đơn nay dùng nhãn đúng ngữ cảnh như “Đang tiếp nhận”, “Đang pha chế” hoặc “Sẵn sàng phục vụ”, kèm chấm nhấp nháy nhẹ.
- Các bước đã qua tự đổi sang “Đã …”; bước chưa tới giữ nhãn trung tính và mờ, không còn bị hiểu nhầm là hoàn thành.
- Bỏ hoàn toàn dòng “Đang tiến hành…”, đồng thời trạng thái hoàn tất không còn animation active.
- Mỗi thẻ ở “Đơn hàng của bàn” hiển thị ETA của chính đơn đó; trang chi tiết dùng cùng copy `Chờ dự kiến: ~N phút`.
- ETA tự ẩn khi đơn đã phục vụ, bị huỷ, không có ETA hoặc ETA bằng 0.
- Thêm Playwright regression coverage cho tiến trình, ETA theo từng đơn, mobile 375×667 và console/network sạch.

## File chính

- `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/page.tsx`: khai báo nhãn đang/đã/chưa tới và ánh xạ trạng thái order sang tiến trình.
- `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/ServiceStepper.Cinematic.tsx`: render nhãn, màu và animation chỉ cho bước đang hoạt động.
- `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/_components/OrderCard.Cinematic.tsx`: hiển thị ETA riêng trên từng thẻ đơn.
- `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/OrderDetailView.Cinematic.tsx`: chuẩn hoá ETA trang chi tiết.
- `chalo-fe/e2e/customer-order-progress-wait.spec.ts`: test browser các trạng thái và ETA.

## Khác với plan

- Không lệch về hành vi. Test ban đầu phụ thuộc việc backend có bàn trống nên bị skip; đã chuyển sang route dữ liệu đơn ngay trong browser để 4 case chạy độc lập, không phụ thuộc dữ liệu môi trường.

## Còn dở / cần lưu ý

- Không. Đã kiểm build production và Playwright 4/4 pass trên bản standalone; mobile được xem trực tiếp ở 375×667.
