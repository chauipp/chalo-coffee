# Thanh toán tự động (SePay) + Trạm in hoá đơn

Luồng: khách quét VietQR chuyển khoản → SePay báo tiền về qua webhook →
backend tự đánh dấu ĐÃ THANH TOÁN → trạm in ở quầy tự in hoá đơn.
Tiền mặt: nhân viên bấm xác nhận trên màn staff → cũng tự in như vậy.

## 1. Đăng ký SePay (làm 1 lần)

1. Tạo tài khoản tại https://sepay.vn, liên kết đúng **tài khoản ngân hàng
   nhận tiền** đã khai trong *Cài đặt → Thanh toán chuyển khoản (VietQR)*.
2. Vào **Webhooks → Thêm webhook**:
   - URL: `https://<TÊN_MIỀN>/api/payment/sepay/webhook`
   - Sự kiện: giao dịch **tiền vào**.
   - Kiểu xác thực: **API Key** → SePay sẽ gửi header
     `Authorization: Apikey <key>`.
3. Copy API key đó, dán vào **trang Cài đặt admin → SePay Webhook API Key**
   rồi Lưu. (Chưa dán key = webhook tắt, hệ thống chỉ xác nhận tay.)
4. Thử: chuyển khoản vài nghìn đồng vào tài khoản với đúng nội dung CK của
   một phiên thanh toán đang mở → vài giây sau màn khách phải tự chuyển
   sang "Thanh toán thành công" và máy in nhả hoá đơn.

Lưu ý khớp lệnh: hệ thống chỉ TỰ xác nhận khi nội dung CK chứa đúng mã
(`CK` + 6 ký tự, QR đã điền sẵn) **và** đúng số tiền. Mọi ca lệch
(sai tiền, phiên hết hạn, trả trùng...) chỉ hiện cảnh báo "cần đối soát tay"
trên màn staff — nhân viên kiểm tra app ngân hàng rồi xác nhận tay.

## 2. Trạm in trên PC Windows ở quầy (làm 1 lần)

1. Cài driver máy in nhiệt (USB), đặt làm **máy in mặc định**.
   Trong *Printing preferences* chọn đúng khổ giấy (80mm hoặc 58mm).
2. Tạo shortcut Chrome in-im-lặng — chuột phải Desktop → New → Shortcut:

   ```
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --app=https://<TÊN_MIỀN>/staff/print-station
   ```

3. Mở shortcut, đăng nhập tài khoản nhân viên. Trang phải hiện chấm xanh
   **"Đang nghe thanh toán"**.
4. Cho trạm tự mở cùng Windows: `Win+R` → `shell:startup` → kéo shortcut vào.

## 3. Vận hành hằng ngày

- Tab trạm in phải luôn mở. Mất kết nối sẽ hiện chấm đỏ **"Mất kết nối!"**
  (tự nối lại khi có mạng).
- Trạm bị tắt đúng lúc khách trả tiền? Đơn vẫn được xác nhận bình thường.
  Mở lại trạm → mục **"Chưa in"** liệt kê các đơn đã thanh toán trong ngày
  chưa in → bấm **In bù**.
- Kẹt giấy/hết giấy: thay giấy rồi bấm **In lại** ở mục "Đã in phiên này".
- Không dùng `--kiosk-printing` (mở tab thường) vẫn được — chỉ khác là hộp
  thoại in của Chrome sẽ hiện lên, bấm Print thủ công.

## 4. Sự cố nhanh

| Triệu chứng | Kiểm tra |
|---|---|
| Chuyển khoản xong không tự xác nhận | Key trong Cài đặt admin đúng chưa? Webhook SePay có log gửi thành công không? Nội dung CK có bị app ngân hàng cắt/sửa mã `CK...`? |
| Có cảnh báo "cần đối soát tay" trên màn staff | Khách chuyển sai số tiền / phiên hết hạn / trả trùng — kiểm tra app ngân hàng rồi xác nhận tay |
| Xác nhận rồi nhưng không in | Tab trạm in có đang mở + chấm xanh? Máy in mặc định đúng chưa? Vào trạm bấm In bù |
| In ra khổ lệch/chữ bé | Chỉnh khổ giấy trong driver máy in (80mm/58mm), tắt header/footer của Chrome |
