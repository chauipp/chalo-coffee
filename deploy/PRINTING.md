# Thanh toán tự động (SePay) + trạm in hoá đơn

Luồng vận hành: khách quét VietQR chuyển khoản → SePay báo tiền về qua webhook
→ hệ thống tự xác nhận phiên thanh toán → trạm in ở quầy tự in hoá đơn. Tiền
mặt vẫn do nhân viên xác nhận, và cũng kích hoạt trạm in.

## 1. Cấu hình SePay

1. Tạo tài khoản tại [SePay](https://sepay.vn) và liên kết đúng tài khoản ngân
   hàng nhận tiền đã khai trong **Cài đặt → Thanh toán chuyển khoản (VietQR)**.
2. Trong SePay, tạo webhook cho giao dịch **tiền vào**:
   - URL: `https://<TEN-MIEN>/api/payment/sepay/webhook`
   - Xác thực: **API Key**. SePay gửi key qua header
     `Authorization: Apikey <key>`.
3. Đăng nhập admin, vào **Cài đặt → Tự động xác nhận chuyển khoản (SePay)**,
   dán API key rồi lưu. Key là trường chỉ-ghi: sau khi lưu, hệ thống chỉ hiện
   trạng thái đã cấu hình chứ không trả key lại trình duyệt.
4. Chuyển thử số tiền nhỏ với đúng mã `CK...` đang hiển thị trên QR của một
   phiên mở. Trong vài giây, màn khách phải báo hoàn tất và trạm in phải nhận
   hóa đơn.

Hệ thống chỉ tự xác nhận khi cả mã chuyển khoản lẫn số tiền khớp. Sai tiền,
phiên hết hạn hoặc giao dịch trùng sẽ vào trạng thái **cần đối soát**, không tự
gạt đơn sang đã thanh toán.

## 2. Dựng trạm in Windows

1. Cài driver máy in nhiệt, đặt nó làm máy in mặc định và chọn đúng khổ giấy
   (80 mm hoặc 58 mm).
2. Tạo shortcut Chrome trên máy quầy:

   ```text
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --app=https://<TEN-MIEN>/staff/print-station
   ```

3. Mở shortcut, đăng nhập nhân viên. Trạm sẵn sàng khi hiện chấm xanh
   **Đang nghe thanh toán**.
4. Để trạm tự mở sau khi bật máy: nhấn `Win+R` → `shell:startup` → đặt shortcut
   vào thư mục đó.

## 3. Vận hành và xử lý nhanh

- Trạm in bị tắt không làm mất thanh toán. Khi mở lại, mục **Chưa in** liệt kê
  các đơn đã trả trong ngày; dùng **In bù** để in lại.
- Hết giấy hoặc lỗi máy in: thay giấy rồi chọn **In lại** trong lịch sử phiên.
- Không dùng `--kiosk-printing` vẫn được, nhưng Chrome sẽ mở hộp thoại in để
  nhân viên bấm in thủ công.

| Triệu chứng | Kiểm tra trước tiên |
| --- | --- |
| Chuyển khoản xong chưa tự xác nhận | Key SePay đã lưu, URL webhook HTTPS truy cập được, nội dung CK có bị sửa và số tiền có khớp không. |
| Có cảnh báo cần đối soát | Kiểm tra giao dịch trong app ngân hàng rồi nhân viên xác nhận thủ công nếu hợp lệ. |
| Đã xác nhận nhưng chưa in | Tab trạm in còn mở, đang chấm xanh và máy in mặc định đúng chưa; sau đó dùng **In bù**. |
| Khổ in lệch | Chỉnh khổ giấy trong driver và tắt header/footer trong Chrome. |
