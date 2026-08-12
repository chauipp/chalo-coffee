# Thiết kế tùy chọn món động

## Mục tiêu

Cho phép admin cấu hình tùy chọn riêng cho từng món; khách, nhân viên POS và luồng đặt món tại bàn chọn các tùy chọn đó trước khi thêm vào giỏ. Mỗi đơn phải lưu lại chính xác tên và giá của món cùng tùy chọn tại thời điểm đặt.

## Phạm vi phase này

- Admin tạo, sửa, xóa và sắp xếp nhóm tùy chọn ngay trong form một sản phẩm.
- Mỗi nhóm có tên, trạng thái bắt buộc hoặc không bắt buộc, kiểu chọn một hoặc nhiều lựa chọn, và thứ tự hiển thị.
- Mỗi lựa chọn có tên, giá cộng thêm và thứ tự hiển thị. Giá mặc định khi admin thêm mới là `0đ`; admin có thể nhập giá cộng thêm không âm.
- Khách quét QR đặt món và staff tại POS cùng dùng một trải nghiệm chọn món. Món không có tùy chọn tiếp tục được thêm nhanh như hiện tại.
- Tùy chọn đã chọn được thể hiện trong giỏ, chi tiết đơn, màn staff/pha chế và các dữ liệu hóa đơn hiện có.
- Backend xác thực lựa chọn theo cấu hình hiện hành của món và tự tính giá. Frontend không được quyết định giá thanh toán.

Không bao gồm thư viện tùy chọn dùng chung giữa các món, tồn kho topping, giới hạn số lượng mỗi topping, hoặc thay đổi cấu trúc/đơn giá của các đơn đã tồn tại.

## Mô hình dữ liệu

`Product` sở hữu nhiều `ProductModifierGroup`; một nhóm sở hữu nhiều `ProductModifierOption`.

- `ProductModifierGroup`: `id`, `productId`, `name` (1–80 ký tự), `selectionType` (`SINGLE` hoặc `MULTIPLE`), `isRequired`, `sortOrder`, `createdAt`.
- `ProductModifierOption`: `id`, `groupId`, `name` (1–80 ký tự), `priceAdjustment` (số nguyên, >= 0), `sortOrder`.

Các nhóm và lựa chọn được ghi đè nguyên khối trong payload tạo/cập nhật món. Xóa một nhóm hoặc lựa chọn khỏi form sẽ xóa cấu hình tương ứng; các order item đã tạo không phụ thuộc foreign key vào tùy chọn nên vẫn giữ nguyên dữ liệu lịch sử.

`OrderItem` có thêm cột JSONB `selectedModifiers`, là snapshot danh sách nhóm/tùy chọn đã chọn. Mỗi phần tử lưu `groupName`, `optionName`, `priceAdjustment`. Cột `price` của order item là **đơn giá cuối cùng trên một ly**: `product.price + tổng priceAdjustment`; `subtotal = price * quantity`.

## Quy tắc nghiệp vụ

- Nhóm `SINGLE` cho phép đúng một lựa chọn nếu bắt buộc; không bắt buộc cho phép không chọn hoặc một lựa chọn.
- Nhóm `MULTIPLE` cho phép chọn không hoặc nhiều lựa chọn; nếu bắt buộc phải có ít nhất một lựa chọn.
- Một option không được gửi lặp lại. Option phải thuộc đúng group và group phải thuộc đúng product trong item.
- Request chứa modifier cho món không có cấu hình, option/group bị xóa, hoặc vi phạm điều kiện bắt buộc sẽ bị từ chối `400 Bad Request` với thông báo tiếng Việt rõ ràng.
- Giá trong request chỉ bao gồm định danh option; server đọc cấu hình và tính tiền. Khi admin chỉnh giá, chỉ các lần đặt sau mới dùng giá mới.
- Hai dòng giỏ chỉ gộp khi cùng product, ghi chú và tổ hợp modifier (cùng option id, không phụ thuộc thứ tự chọn). Các tổ hợp khác nhau phải là dòng độc lập.
- Ghi chú tự do hiện có vẫn được giữ lại để dùng cho yêu cầu không thể cấu hình trước.

## API và hợp đồng dữ liệu

Các endpoint product hiện có sẽ trả thêm `modifierGroups` đầy đủ cho product detail/list được dùng để đặt món. `simple-list` dùng trong dropdown admin không cần trả cấu hình này.

Payload tạo/cập nhật product nhận thêm:

```ts
modifierGroups?: Array<{
  name: string;
  selectionType: "SINGLE" | "MULTIPLE";
  isRequired: boolean;
  sortOrder: number;
  options: Array<{
    name: string;
    priceAdjustment: number;
    sortOrder: number;
  }>;
}>;
```

Mỗi item tạo order nhận thêm `modifierOptionIds?: string[]`. Backend trả `selectedModifiers` trong `OrderItemDto`.

## Trải nghiệm admin

Form sản phẩm có section “Tùy chọn món”, hiển thị sau phần giá/vận hành:

- Nút “Thêm nhóm tùy chọn” thêm một nhóm trống với chọn một, không bắt buộc; nhóm chỉ hợp lệ khi có tên và ít nhất một lựa chọn.
- Trong nhóm, admin sửa tên, kiểu chọn, bắt buộc, thêm/xóa lựa chọn, nhập phụ thu và xóa cả nhóm.
- Mỗi lựa chọn mới hiển thị phụ thu `0đ` mặc định.
- Bố cục chạm tốt trên mobile, các nút xóa có nhãn truy cập được, và phần giá ghi rõ “cộng thêm”.

## Trải nghiệm đặt món

Khi người dùng bấm một món có tùy chọn, mở sheet/modal chi tiết hiện có và hiển thị các nhóm lựa chọn trước phần ghi chú. Nhóm bắt buộc có dấu bắt buộc và chặn nút thêm giỏ cho đến khi hợp lệ. Giá hiển thị và nút thêm giỏ cập nhật theo lựa chọn.

Tại POS staff sử dụng cùng quy tắc: chọn option trước khi đưa vào giỏ; giá và mô tả modifier hiện ở dòng giỏ. Trên giỏ khách và staff, mỗi dòng hiện phần lựa chọn ngắn gọn dưới tên món. Màn đơn, pha chế và receipt hiển thị snapshot này để barista làm đúng ly.

## Migration và tương thích

Migration bổ sung hai bảng cấu hình, indexes foreign key/sort order cần thiết và `order_items.selectedModifiers JSONB NOT NULL DEFAULT '[]'`. Các order item cũ có mảng rỗng, giá và tổng tiền không đổi. Migration chạy tự động trong deploy production hiện tại.

## Kiểm thử và nghiệm thu

- Unit test backend cho validation lựa chọn, tính đơn giá từ server, snapshot không đổi sau khi menu bị sửa, và các tình huống bắt buộc/single/multiple.
- Unit test frontend cho key gộp cart dựa trên modifier và tổng giá cart.
- Form schema test kiểm tra giá mặc định `0` và validation cấu trúc nhóm/lựa chọn.
- Playwright: admin tạo món có một nhóm bắt buộc và một topping; khách/staff chọn lựa chọn, thấy giá cập nhật, thêm hai tổ hợp khác nhau thành hai dòng, sau đó đặt đơn và thấy lựa chọn trong chi tiết đơn.
- Không báo hoàn tất UI nếu chưa mở và kiểm bằng Playwright; nếu môi trường/test credential chặn thì nêu rõ phần chưa thể kiểm.

## Rủi ro và quyết định

Chỉ cho phụ thu không âm trong phase này để tránh mô hình giảm giá/phức tạp hóa bảng giá. Tùy chọn thuộc từng món nhằm đảm bảo admin được linh hoạt hoàn toàn mà không phát sinh thay đổi dây chuyền sang các món khác.

## Plan thực thi

Xem kế hoạch chi tiết: `../plans/2026-08-12-product-modifiers.md`.
