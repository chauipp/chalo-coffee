# Tồn kho nguyên liệu và công thức món

**Mục tiêu:** Biến trạng thái “còn hàng/hết hàng” từ thao tác thủ công thành dữ
liệu vận hành đáng tin: mỗi món có công thức, mỗi nguyên liệu có tồn thực tế và
lịch sử điều chỉnh, POS/menu tự chặn món không đủ nguyên liệu.

## Phạm vi và quyết định

- Một kho dùng chung cho quán hiện tại; không bổ sung nhiều chi nhánh trong đợt
  này để không làm sai mô hình dữ liệu sau này.
- Admin tạo nguyên liệu, nhập mức tồn đầu/kỳ, mức cảnh báo, công thức và các
  điều chỉnh có lý do. Moderator chỉ xem cảnh báo; không được sửa sổ kho.
- Mỗi công thức ghi lượng nguyên liệu cho **một đơn vị món**. Đơn tạo thành công
  sẽ trừ tồn ngay trong cùng transaction. Đơn bị hủy trả lại đúng lượng đã trừ.
  Không trừ lại khi chuyển trạng thái pha chế để tránh trừ hai lần.
- Một sản phẩm không có công thức vẫn bán bình thường (phù hợp món chưa cần
  kiểm kho). Món có công thức chỉ bán khi tất cả nguyên liệu đủ.
- Khi thiếu một thành phần, trạng thái sản phẩm được đồng bộ thành
  `OUT_OF_STOCK`, nên cả menu khách và POS vốn đã lọc `AVAILABLE` đều không bán
  được. Khi nhập thêm hàng, chỉ những món bị `OUT_OF_STOCK` do kiểm kho được mở
  lại; `UNAVAILABLE` do admin tắt thủ công không bị đổi.
- Sổ kho là append-only: không sửa/xóa movement. Mỗi hàng mang loại
  `OPENING | RECEIPT | ADJUSTMENT | SALE | CANCELLATION`, delta có dấu, ghi chú,
  actor và order tham chiếu nếu có.

## Dữ liệu và tính nhất quán

```text
Ingredient (onHand, reorderLevel, unit)
  ├── ProductRecipe (productId, quantity)
  └── InventoryMovement (delta, reason, actor, orderId)

Order.create transaction
  ├── khóa Ingredient cần dùng theo thứ tự id
  ├── kiểm onHand >= tổng recipe × quantity
  ├── ghi SALE movement, giảm onHand
  └── lưu Order

Order.cancel transaction
  ├── đọc SALE movements của order chưa được đảo
  ├── ghi CANCELLATION movement, tăng onHand
  └── cập nhật khả dụng món
```

Các thao tác tạo đơn đồng thời dùng pessimistic lock và thứ tự khóa cố định để
không bán vượt tồn hoặc deadlock. Nếu kho thiếu, request trả `400` với tên
nguyên liệu/món; không tạo đơn một phần.

## API và giao diện

Namespace `/inventory`:

- `GET /inventory/ingredients`, `POST /inventory/ingredients`,
  `PUT /inventory/ingredients/:id`, `POST /inventory/ingredients/:id/adjust`
  (Admin).
- `GET /inventory/ingredients/:id/movements` (Admin).
- `GET /inventory/low-stock` (Admin/Moderator): danh sách thấp hơn mức cảnh
  báo và số món đang bị khóa.
- `GET/PUT /inventory/products/:productId/recipe` (Admin).

Admin có trang `/admin/inventory`: KPI số nguyên liệu sắp hết/hết, bảng nguyên
liệu, biểu mẫu nhập/điều chỉnh, drawer lịch sử; công thức được chỉnh từ trang
sản phẩm để không tách ngữ cảnh thực đơn. Cảnh báo read-only được thêm vào khu
admin dashboard và màn POS staff; không tạo thông báo gây nhiễu từng request.

## Xử lý lỗi, bảo mật, nghiệm thu

- Giá trị tiền/lượng dùng `numeric(12,3)` ở DB và number phía DTO; giới hạn
  dương cho recipe/opening/receipt, adjustment dùng delta không bằng 0.
- Không tin trạng thái client. Kiểm kho diễn ra trên backend khi tạo order.
- Test unit chứng minh: thiếu kho không tạo order, đơn hủy hoàn tồn một lần,
  hai product dùng chung nguyên liệu không trừ âm, movement không có route sửa/xóa.
- Playwright mở `/admin/inventory` desktop và 375×667, tạo/điều chỉnh nguyên
  liệu bằng mock API, kiểm không tràn ngang, console/network sạch; xác minh POS
  hiển thị cảnh báo nếu có hàng thấp.

## Không làm trong đợt này

FIFO/lô-hạn dùng, chuyển kho nhiều chi nhánh, định giá vốn/COGS, kiểm kê bằng
barcode và forecast mua hàng. Schema movement giữ actor/time/reference để mở
rộng các nhu cầu này mà không phải thay lịch sử.

## Plan thực thi

[Kế hoạch triển khai](../plans/2026-08-17-inventory-recipes.md)
