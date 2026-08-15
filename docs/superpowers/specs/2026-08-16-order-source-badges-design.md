# Phân biệt nguồn tạo đơn

## Mục tiêu

Mỗi đơn mới phải lưu được kênh tạo đơn để nhân viên nhìn vào khu pha chế và admin biết đó là khách tự quét QR hay nhân viên lên đơn tại quầy. Các đơn cũ không được suy diễn nguồn và phải hiển thị `N/A`.

## Phạm vi

- Thêm nguồn đơn vào dữ liệu `Order` và mọi DTO trả về cho frontend.
- Đơn từ menu QR được ghi `QR`; đơn tạo tại POS của nhân viên được ghi `POS`.
- Migration đặt nguồn của dữ liệu lịch sử là `N/A`.
- Hiện badge nguồn trên thẻ đơn tại bảng vận hành admin và danh sách/khu pha chế dùng chung dữ liệu đơn.
- Với đơn POS có pager, giữ thông tin thẻ riêng (ví dụ `Thẻ #12`); pager không thay thế nguồn đơn.

## Không làm

- Không đoán hoặc hồi tố nguồn cho đơn cũ.
- Không thay đổi luồng tạo đơn, trạng thái pha chế, hay logic thanh toán gộp các đơn cùng bàn.
- Không tạo kênh đặt món thứ ba.

## Mô hình dữ liệu

`orderSource` là enum gồm `QR`, `POS`, và `N_A`. Cột không null, mặc định `N_A`, vì vậy dữ liệu cũ và mọi tích hợp chưa cập nhật vẫn hợp lệ. Backend tự xác định nguồn từ ngữ cảnh xác thực: người dùng nội bộ tạo tại POS là `POS`; khách hoặc request không xác thực qua QR là `QR`. Không nhận nguồn đơn từ payload, để khách không thể tự gắn nhãn `POS`.

## Giao diện và luồng dữ liệu

- Trang menu QR tạo đơn qua endpoint công khai và backend lưu `QR`.
- Trang staff POS giữ token đăng nhập khi tạo đơn; backend nhận diện vai trò nội bộ và lưu `POS`.
- `OrderDto` mang `orderSource`, nên admin, prep dock và các thành phần hiển thị đơn không cần tự suy luận.
- Badge hiển thị: `QR`, `Quầy`, hoặc `N/A`. Badge pager chỉ hiện thêm khi có `pagerNumber`.

## Kiểm thử

- Backend: migration/schema và tạo đơn lưu đúng nguồn; đơn cũ/mặc định là `N_A`.
- Frontend: payload QR/POS đúng giá trị, badge ánh xạ đúng ba nguồn.
- UI Playwright: kiểm tra trang admin/bếp hiển thị badge và không làm hỏng thao tác vận hành.

## Tiêu chí nghiệm thu

- Không thể nhầm đơn QR với đơn POS trong giao diện nội bộ.
- Đơn POS có pager hiện được cả nguồn và số thẻ.
- Đơn không có thông tin nguồn hiện `N/A`, không bị gán nhầm thành QR hoặc POS.

## Plan thực thi

[Kế hoạch thực thi](../plans/2026-08-16-order-source-badges.md).
