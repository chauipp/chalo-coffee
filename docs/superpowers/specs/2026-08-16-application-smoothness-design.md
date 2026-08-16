# Tối ưu độ mượt toàn ứng dụng

## Bối cảnh và số đo ban đầu

Luồng ưu tiên là Staff POS khi cuộn danh sách món. Bản production local với 49 món giữ p95 frame khoảng 16.8 ms, nên chưa tái hiện được giật trên máy hiện tại. Tuy nhiên, POS hiện render tích luỹ toàn bộ trang sản phẩm, không virtualize, mỗi cập nhật giỏ hàng tạo props mới cho mọi card, và tải ảnh eager. Đây là nguyên nhân cấu trúc có thể gây giật ở menu lớn hoặc thiết bị yếu.

Audit cũng xác định các chi phí nền và backend có thể làm toàn hệ thống kém mượt: polling khi UI không dùng, danh sách customer mount quá nhiều state/modal, thiếu index `order_items` foreign key, page size không giới hạn, và N+1 tính ETA.

## Mục tiêu

- POS luôn phản hồi mượt khi cuộn và thêm món, kể cả khi danh sách có hàng trăm sản phẩm.
- Không thực hiện request/poll nền cho UI đang đóng hoặc không thể thấy.
- Không để truy vấn quan trọng suy giảm thành quét bảng khi số đơn/món tăng.
- Giữ nguyên nghiệp vụ đặt món, pager, pha chế, thanh toán, và thao tác hiện tại.

## Phạm vi pha 1 — tối ưu chắc chắn, ít rủi ro

### Staff POS

- Tách product grid thành component có boundary rõ ràng.
- Dùng map giỏ hàng theo `productId` để tra số lượng O(1), callback ổn định và `React.memo` cho product card.
- Ảnh card dùng lazy loading/async decoding; ảnh không được làm chặn cuộn.
- Áp dụng virtual grid cho danh sách sản phẩm, chỉ mount các card trong/giáp viewport.
- Giữ nguyên tìm kiếm, category, modifier, infinite page và nội dung giỏ hàng.

### Request nền frontend

- Chỉ mount `PagerBoard` khi người dùng mở panel, để không poll pager khi đóng.
- Prep dock không được poll/render dữ liệu khi bị ẩn hoàn toàn trên mobile; desktop giữ realtime hiện có.
- Admin Orders không được khởi tạo SSE/query nặng của mode không nhìn thấy; state filter lịch sử vẫn phải giữ khi đổi tab.

### Backend an toàn và có thể đo

- Migration thêm index cho `order_items.orderId` và `order_items.productId`.
- Clamp kích thước trang ở các endpoint page để tránh payload/join không giới hạn, với mức tối đa được ghi rõ trong DTO/service.
- Thay truy vấn ETA theo từng đơn ở `by-token` bằng dữ liệu queue tính một lần cho một response, giữ nguyên semantics ETA.

## Phạm vi pha 2 — chỉ triển khai nếu đo cho thấy cần

- Customer menu có virtual/collapsible rendering và chỉ mount một modifier modal đang mở.
- Batch product lookup khi tạo order để rút ngắn transaction/lock trên cùng bàn.
- Pagination/summary riêng cho shift reports lớn và tối ưu SSE fanout khi số kết nối tăng.

Pha 2 không nằm trong thay đổi đầu tiên: nó cần benchmark volume thực tế và kiểm thử nghiệp vụ sâu hơn.

## Thiết kế kỹ thuật

Product grid POS dùng một virtualizer React có overscan nhỏ, giữ card key theo `product.id` để trạng thái giỏ hàng không bị sai khi cuộn. Dữ liệu cart được derivation một lần bằng `Map`; card chỉ nhận primitive `quantity`, `product` và callback có identity ổn định. Khi search/category thay đổi, virtualizer reset về đầu list.

Các query phụ nhận `enabled` hoặc component chỉ được mount khi UI có thể dùng. Đây là thay đổi vòng đời UI, không đổi endpoint/response. Với Admin Orders, tách lifetime của query/SSE khỏi lifetime visual để vẫn giữ History mounted và không mất filter.

Backend dùng migration có thể rollback cho index. Giới hạn page size được validate ở boundary controller/DTO; client hiện tại trong giới hạn vẫn không đổi response. Tối ưu ETA phải có test parity cho thứ tự và giá trị response, không cache chéo request.

## Kiểm thử và đo lại

- Unit test: cart lookup, props/card render isolation, page-size clamp, ETA batch parity.
- Browser production: POS với fixture ít nhất 300 sản phẩm; cuộn, thêm món, mở/đóng pager, desktop và mobile. Thu console error, response >=400, DOM card count/scroll frame interval.
- API/database: `EXPLAIN (ANALYZE, BUFFERS)` trước/sau index với dữ liệu volume; request page vượt giới hạn phải bị clamp/validation xác định.
- Regression suite frontend/backend xanh; không thay đổi luồng đặt đơn, modifier, thanh toán hoặc pager.

## Tiêu chí nghiệm thu

- Virtual POS không giữ toàn bộ card ngoài viewport; thao tác thêm món không buộc render lại mọi card đang tải.
- Pager không gửi request khi đóng; mobile không duy trì prep poll bị ẩn.
- Không có page endpoint trả payload vô hạn từ `pageSize` do client truyền vào.
- Index migration có `down` an toàn và không làm đổi dữ liệu.
- Các màn POS/admin/customer cũ còn hoạt động đúng sau tối ưu.

## Plan thực thi

Sẽ thêm sau khi spec được duyệt: [plan](../plans/2026-08-16-application-smoothness.md).
