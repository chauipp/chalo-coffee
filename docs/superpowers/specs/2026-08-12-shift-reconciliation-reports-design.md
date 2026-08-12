# Thiết kế: chốt ca, đối soát tiền và báo cáo

## Mục tiêu

Cho Chalo Coffee ghi nhận chính xác từng lần thu tiền, vận hành một quỹ tiền mặt chung theo ca và chốt ca có số tiền dự kiến, tiền thực đếm cùng chênh lệch. Staff và admin dùng được trên điện thoại; admin có báo cáo theo ca hoặc khoảng ngày và xuất CSV.

## Quyết định vận hành

- Một thời điểm chỉ có một ca tiền mặt `OPEN` cho toàn quán. Staff (`MODERATOR`) hoặc admin có thể mở/chốt ca; bản ghi luôn lưu người mở và người chốt.
- Ca có tiền đầu ca (mặc định 0). Tiền dự kiến lúc chốt bằng tiền đầu ca cộng toàn bộ thanh toán tiền mặt được ghi nhận khi ca mở. Chênh lệch bằng tiền thực đếm trừ tiền dự kiến.
- Thanh toán vẫn không bị chặn khi chưa mở ca, để tránh dừng phục vụ. Những khoản này nằm trong báo cáo nhưng được gắn “ngoài ca”, không đi vào tiền dự kiến của ca nào.
- Thanh toán là sổ cái bất biến. Không sửa trực tiếp phương thức/số tiền trên đơn hoặc giao dịch đã ghi; hoàn tiền/điều chỉnh là phase sau, bằng giao dịch bù riêng.
- Dùng VND nguyên, không có phần thập phân. Tiền khách đưa và tiền thừa chỉ hợp lệ với tiền mặt. Chuyển khoản/QR không nhận hai giá trị này.

## Mô hình dữ liệu

### Sổ thanh toán

`payment_transactions` là một lần thu ngân xác nhận thanh toán, có `method` (`CASH`, `BANK_TRANSFER`, `LEGACY`), `source` (`STAFF`, `CUSTOMER_CONFIRMATION`, `LEGACY`), tổng tiền, tiền nhận, tiền thừa, người thu nullable, thời điểm thu và `cashShiftId` nullable.

`payment_allocations` phân bổ một transaction vào từng order. `orderId` unique để một đơn chỉ được phân bổ đúng một lần. Cấu trúc cha–con giữ đúng trường hợp “một lần quét QR/thanh toán tiền mặt trả nhiều đơn”: tổng tiền/tiền đưa/tiền thừa không bị nhân lên theo số đơn.

Migration backfill tất cả đơn lịch sử có `paidStatus = true` thành một transaction `LEGACY`/`LEGACY` và allocation tương ứng, thời điểm dùng `updatedAt`. Báo cáo tách riêng khoản lịch sử/chưa phân loại, không giả định là tiền mặt hoặc chuyển khoản.

### Ca tiền mặt

`cash_shifts` có `status` (`OPEN`, `CLOSED`), tiền đầu ca, thời gian/người mở, thời gian/người chốt, tiền thực đếm, tiền dự kiến, chênh lệch và ghi chú. Một partial unique index chỉ cho phép một dòng `OPEN`. Ca đã `CLOSED` không có endpoint sửa/xóa.

## Luồng thanh toán

1. Thu ngân ở chi tiết đơn chọn “Đơn này” hoặc “Cả bàn”, rồi chọn QR chuyển khoản hoặc tiền mặt.
2. Với tiền mặt, nhập tiền khách đưa; backend xác thực số tiền nhận không nhỏ hơn tổng, tự tính tiền thừa và không tin giá trị tính ở trình duyệt.
3. Backend khóa các đơn/phiên checkout, tạo transaction và allocations trong cùng database transaction, rồi mới đánh dấu orders đã thanh toán/cộng điểm/cập nhật bàn. Retry trả idempotent, không sinh ledger thứ hai.
4. Luồng khách tự xác nhận checkout công khai vẫn tương thích nhưng ghi `BANK_TRANSFER` với source `CUSTOMER_CONFIRMATION`, không có cashier và không được coi là khoản QR đã thu ngân đối soát. Báo cáo hiển thị thành nhóm riêng “khách tự xác nhận”.

## API và phân quyền

- Các endpoint staff thanh toán yêu cầu JWT `ADMIN`/`MODERATOR`, nhận `method` và `receivedAmount` nếu là tiền mặt, đồng thời lấy cashier từ JWT.
- Các endpoint checkout công khai giữ secret hiện có để không làm hỏng QR khách; chúng dùng payment source `CUSTOMER_CONFIRMATION`.
- Module `shift` mới, bảo vệ `ADMIN`/`MODERATOR`:
  - `GET /shift/current`
  - `POST /shift/open`
  - `POST /shift/current/close`
  - `GET /shift/history`
  - `GET /shift/report?from=&to=&shiftId=`
- `GET /shift/report` trả tổng thanh toán đã đối soát theo tiền mặt/QR, khách tự xác nhận, legacy, số đơn đã trả, đơn hủy, đơn chưa trả, AOV, tổng tiền mặt kỳ vọng/đếm/chênh lệch và danh sách giao dịch cho CSV. Report theo ca lọc `cashShiftId`; report khoảng ngày lọc `paidAt` theo thời điểm thu.

## Giao diện

- Thêm “Chốt ca” vào điều hướng staff và admin. Trang `/staff/shift` dùng chung quyền staff/admin; admin có thể mở trực tiếp qua `/admin/shift` cùng component/logic.
- Mobile-first: thẻ ca hiện tại, CTA mở/chốt rõ ràng, input tiền số lớn, tóm tắt tiền mặt/QR và cảnh báo thanh toán ngoài ca. Mọi vùng chạm tối thiểu 44px.
- Chốt ca bắt người dùng nhập tiền thực đếm và ghi chú khi có chênh lệch; modal hiển thị công thức rõ ràng trước khi xác nhận.
- Admin route hiển thị báo cáo ngày/khoảng ngày, phương thức thanh toán, các chỉ số vận hành và danh sách giao dịch. Nút CSV tạo file UTF-8 BOM để Excel đọc tiếng Việt đúng.
- Panel thanh toán hiện có vẫn giữ QR và tính tiền thừa, nhưng gửi method/received amount tới backend; UI không tự coi thanh toán là hoàn thành nếu API lỗi.

## Ngoài phạm vi

- Hoàn tiền, hủy giao dịch đã thu, đóng nhiều quỹ tiền mặt song song, phân quyền cashier theo từng cửa hàng, SePay webhook tự đối soát và in hóa đơn.
- Thay thế dashboard doanh thu/top sản phẩm hiện có; dashboard tiếp tục dùng chỉ số cũ, báo cáo đối soát là màn độc lập.

## Kiểm thử và nghiệm thu

- Backend: tạo payment cash/QR, validate tiền khách đưa, payment gộp, idempotency, gắn ca đang mở, backfill lịch sử, mở/chốt ca cạnh tranh và công thức chênh lệch.
- API report: phân tách cash/QR/khách tự xác nhận/legacy, đơn hủy/chưa trả và lọc theo thời gian/ca.
- Frontend: payload thanh toán đúng, modal mở/chốt ca, báo cáo/CSV; Playwright mở luồng thực ở desktop và 375×667, console sạch và request mock không lỗi ngoài SSE đã biết.

## Plan thực thi

[2026-08-12-shift-reconciliation-reports.md](../plans/2026-08-12-shift-reconciliation-reports.md)
