# Landing experience — kết quả

**Spec:** [2026-08-12-landing-experience-design.md](../specs/2026-08-12-landing-experience-design.md)
**Plan:** [2026-08-12-landing-experience.md](../plans/2026-08-12-landing-experience.md)

## Đã làm gì

- Thêm ba lối tắt theo mood để đưa khách đến nhóm Cà phê, Trà hoặc Bánh/đồ ngọt; nếu quán chưa tạo nhóm tương ứng, trang vẫn an toàn ở trạng thái “Tất cả”.
- Làm minh hoạ ly cà phê có hơi nước chuyển động nhẹ, tự tắt khi khách chọn Reduced Motion.
- Thêm thanh thao tác cố định cho điện thoại khi khách đã cuộn qua phần mở đầu, với hai hành động Thực đơn và Chỉ đường.
- Chừa vùng đệm đáy và kiểm tra không có cuộn ngang trên màn hình 375px.
- Kiểm tra Chromium desktop/mobile: mood scroll tới menu, dock hiển thị đúng thời điểm, console không error, không có request động thất bại.

## File chính

- `chalo-fe/src/app/_components/PublicLanding.tsx`: điều khiển mood, observer cho dock mobile và cấu trúc CTA mới.
- `chalo-fe/src/app/_components/landing-data.ts`: hàm tìm danh mục theo các từ khoá mood với fallback an toàn.
- `chalo-fe/src/app/globals.css`: animation hơi nước và quy tắc Reduced Motion.
- `chalo-fe/e2e/public-landing.spec.ts`: kiểm luồng mood, dock mobile và overflow.
- `chalo-fe/src/app/_components/landing-data.test.mts`: kiểm lựa chọn danh mục theo keyword.

## Khác với plan

Không lệch. Test dock dùng thao tác cuộn cửa sổ thay vì gọi scroll-into-view cho menu để mô phỏng chính xác lúc hero rời viewport.

## Còn dở / cần lưu ý

Không. Danh mục trên môi trường test local đang rỗng do backend menu không chạy; cơ chế chọn mood đã có unit test trên fixture menu và tự fallback khi production chưa có danh mục phù hợp.
