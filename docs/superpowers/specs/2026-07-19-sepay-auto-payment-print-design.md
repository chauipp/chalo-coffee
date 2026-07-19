# Tự động xác nhận thanh toán qua SePay + trạm in hóa đơn

**Ngày:** 2026-07-19
**Trạng thái:** Đã duyệt thiết kế (chờ plan triển khai)

## 1. Bối cảnh & mục tiêu

Hiện tại thanh toán hoàn toàn thủ công/tự khai: khách chuyển khoản theo mã VietQR
(hiển thị tĩnh) rồi bấm "Tôi đã thanh toán", hoặc nhân viên bấm xác nhận. Không có
gì kiểm chứng tiền đã về. Máy in chưa được tích hợp (chỉ có `window.print()` tay
từ modal nhân viên).

**Mục tiêu:**

1. Khi khách chuyển khoản thành công → hệ thống **tự động** đánh dấu đã thanh toán
   (`paidStatus = true`), không cần ai bấm gì.
2. Ngay khi thanh toán được xác nhận (chuyển khoản **hoặc** tiền mặt do nhân viên
   xác nhận) → **máy in nhiệt ở quầy tự in hóa đơn**.

**Giữ nguyên luồng gọi món:** khách quét QR đặt món → đơn hiện ngay trên màn
nhân viên/pha chế như hiện tại. Thanh toán KHÔNG phải điều kiện để đơn xuất hiện.

## 2. Không làm (out of scope)

- Không thêm trạng thái đơn mới, không sửa enum `OrderStatus`, không bắt buộc trả trước.
- Không tự hủy đơn chưa thanh toán.
- Không viết print agent cài riêng (ESC-POS) — dùng trình duyệt in; có thể nâng cấp sau.
- Không đổi luồng Kanban/màn pha chế.

## 3. Quyết định đã chốt

| Quyết định | Lựa chọn |
|---|---|
| Nguồn xác nhận tiền về | **SePay** webhook (khách chuyển khoản VietQR) |
| Tiền mặt | Nhân viên xác nhận tại quầy như hiện tại (`checkout/complete-staff`, `/order/pay`) — xác nhận xong cũng tự in |
| Máy in lỗi/tắt trạm in | Thanh toán vẫn xác nhận bình thường; in bù/in lại được |
| Thiết bị in | Máy in nhiệt USB gắn PC Windows luôn bật ở quầy; in qua Chrome `--kiosk-printing` |
| Nút "Tôi đã thanh toán" của khách | **Bỏ** — thay bằng màn chờ "Đang chờ ngân hàng xác nhận…" cập nhật qua SSE |

## 4. Luồng nghiệp vụ

### 4.1 Chuyển khoản (tự động)

1. Khách bấm "Thanh toán" (1 đơn hoặc cả bàn) → FE gọi BE tạo **checkout session**.
   BE sinh `payCode` duy nhất (VD `CK7F3K2M`) lưu trong session.
2. FE render VietQR: đúng số tiền + nội dung CK = payCode (qua `buildVietQR`,
   `addInfo` lấy **nguyên văn từ BE**, không tự ghép nữa).
3. Khách chuyển khoản → tiền về tài khoản → SePay bắn webhook `POST /payment/sepay/webhook`.
4. BE xác thực API key → chống trùng theo mã giao dịch SePay → tìm payCode trong
   nội dung CK (substring match, vì ngân hàng có thể chèn thêm chữ) → đối chiếu số tiền.
5. Khớp đúng mã + **đúng số tiền** → complete session: `paidStatus = true` cho các
   đơn, bàn được xử lý như luồng `checkoutComplete` hiện tại (rotate QR token…),
   bắn SSE `payment_completed`.
6. Màn khách: đang ở trạng thái chờ → nhận SSE → "Thanh toán thành công".
   Màn nhân viên cập nhật. **Trạm in tự in hóa đơn.**

### 4.2 Tiền mặt / xác nhận tay

Nhân viên xác nhận như hiện tại (modal đơn hàng, hoặc checkout `complete-staff`).
Mọi đường xác nhận thanh toán đều bắn cùng sự kiện SSE → trạm in in như nhau.
Đây cũng là **đường dự phòng** khi SePay trục trặc hoặc khách ghi sai nội dung CK.

### 4.3 Trường hợp lệch

- **Sai/thiếu/thừa số tiền, hoặc có mã nhưng session hết hạn/đã hủy, hoặc session
  ĐÃ thanh toán trước đó (khách trả trùng — vd nhân viên vừa xác nhận tiền mặt xong
  tiền CK mới về):** KHÔNG tự gạt. Ghi log giao dịch (`NEEDS_REVIEW`) + bắn SSE cảnh
  báo để màn nhân viên hiện thông báo "Có giao dịch chuyển khoản cần đối soát tay"
  → nhân viên kiểm tra app ngân hàng rồi xác nhận tay / hoàn tiền.
- **Không tìm thấy payCode trong nội dung CK:** chỉ ghi log giao dịch (đối soát sau).
- **Webhook gọi trùng (SePay retry):** bỏ qua nhờ unique theo mã giao dịch SePay; trả 200.

## 5. Thiết kế Backend (chalo-be)

### 5.1 Module mới `payment`

- `POST /payment/sepay/webhook` — public (không JWT), xác thực bằng header
  `Authorization: Apikey <key>` (chuẩn SePay). Key so với cấu hình trong app_settings.
  Luôn trả 200 khi đã nhận và ghi log hợp lệ (kể cả không khớp) để SePay không retry vô hạn;
  trả 401 khi sai key.
- Service xử lý: dedup → parse payCode → khớp session → gọi sang `OrderService`
  (tái dùng logic complete của `checkoutComplete`, tách phần xử lý chung thành
  method nội bộ không cần `clientSecret`).

### 5.2 Dữ liệu (migration mới)

- `checkout_sessions.payCode` — varchar ngắn, unique, index. Sinh dạng `CK` +
  6-8 ký tự A-Z/2-9 (bỏ ký tự dễ nhầm 0/O/1/I), thử lại nếu trùng.
- Bảng mới `sepay_transactions`: id, `sepayTxId` (unique), số tiền, nội dung CK,
  tài khoản nhận, thời gian giao dịch, `matchedSessionId` (nullable), trạng thái
  xử lý (`MATCHED` / `NO_MATCH` / `DUPLICATE` / `NEEDS_REVIEW` — gồm sai số tiền,
  session hết hạn/hủy, session ĐÃ thanh toán trước đó = nguy cơ trả 2 lần),
  payload gốc (json), createdAt.
- `app_settings.sepayWebhookKey` — varchar nullable. Null = webhook tắt (trả 503).

### 5.3 Hợp nhất đường thanh toán chuyển khoản qua checkout session

Hiện có 2 đường lệch nhau: đơn lẻ (`/order/pay` + QR memo FE tự ghép) và cả bàn
(checkout session). Để webhook khớp được cả hai:

- `checkout/start` nhận thêm `orderIds?: string[]` — có thì session chỉ gồm các
  đơn đó (vẫn validate thuộc đúng bàn + chưa trả), không có thì như cũ (tất cả đơn chưa trả).
- Response của `checkout/start`/`preview` trả thêm `payCode`.
- Màn "thanh toán 1 đơn" của khách chuyển sang dùng checkout session (1 phần tử)
  thay vì `/order/pay`. `/order/pay` giữ lại cho nhân viên xác nhận tay và
  **chuyển thành JWT-guarded** (khách không còn gọi nữa).
- Public endpoint `POST /order/checkout/complete` (khách tự khai) — **xóa** cùng
  với nút FE. Các endpoint staff (`complete-staff`, `/order/pay-all`) giữ nguyên.

### 5.4 SSE

- Đảm bảo MỌI đường hoàn tất thanh toán (webhook, complete-staff, `/order/pay`,
  `/order/pay-all`) bắn `payment_completed` với payload đủ cho trạm in:
  `{ orderIds, tableName, totalAmount, source: 'sepay' | 'staff' }`.
- Sự kiện mới `payment_review_needed` cho trường hợp lệch (mục 4.3) → staff toast.

## 6. Thiết kế Frontend (chalo-fe)

> Lưu ý repo: đọc `chalo-fe/AGENTS.md` — Next.js bản này có breaking changes,
> phải xem docs trong `node_modules/next/dist/docs/` trước khi code.

### 6.1 Trạm in `/staff/print-station`

- Trang staff (đăng nhập như staff khác), chạy trên Chrome PC quầy.
- Nghe SSE `payment_completed` → fetch chi tiết đơn → render hóa đơn → `window.print()`.
- **1 sự kiện thanh toán = 1 tờ hóa đơn** (gộp mọi đơn trong session: danh sách món
  từng đơn + tổng cộng) — mở rộng `Receipt.tsx` (variant "final") nhận nhiều đơn.
- Danh sách hóa đơn đã in trong ngày + nút **In lại** từng cái.
- Hàng chờ khi tab vừa mở lại: hiện các thanh toán gần nhất chưa in (đối chiếu
  đơn `paidStatus=true` hôm nay với log in cục bộ - localStorage) để in bù.
- Chỉ báo trạng thái kết nối SSE (xanh/đỏ) to rõ để nhân viên biết trạm đang sống.
- In im lặng: kiosk mode — nếu người dùng mở bình thường, hộp thoại in của Chrome
  hiện lên vẫn dùng được (bấm Print tay), chỉ là không "im lặng".

### 6.2 Màn khách

- `CheckoutSessionPanel` + màn thanh toán đơn lẻ: bỏ nút "Tôi đã thanh toán";
  QR dùng `payCode` từ BE; bên dưới hiện trạng thái chờ ("Đang chờ ngân hàng xác
  nhận — thường vài giây sau khi chuyển") + tự chuyển màn thành công khi nhận SSE
  (đã có `useCustomerOrderEvents`).
- Thêm ghi chú "Trả tiền mặt? Vui lòng ra quầy" (không cần chọn trước phương thức).

### 6.3 Admin settings

- Thêm ô "SePay Webhook API Key" cạnh cấu hình ngân hàng hiện có.

## 7. Cấu hình & vận hành (tài liệu đi kèm)

Viết thêm `deploy/PRINTING.md`:

1. **SePay:** tạo tài khoản, liên kết bank, tạo webhook trỏ
   `https://<domain>/api/payment/sepay/webhook`, chọn auth "Api Key", dán key
   vào trang cài đặt admin.
2. **Trạm in trên PC Windows:** cài driver máy in nhiệt (khổ 80mm hoặc 58mm, đặt làm
   máy in mặc định, tắt header/footer), tạo shortcut Chrome:
   `chrome.exe --kiosk-printing --app=https://<domain>/staff/print-station`,
   bỏ vào thư mục Startup để mở cùng Windows.
3. Khổ giấy hóa đơn: CSS `@media print` khổ 80mm (đã có nền tảng trong `globals.css`).

## 8. Testing

- **BE unit (webhook service):** khớp đúng → complete + SSE; sai số tiền → MISMATCH +
  SSE review; không có mã → NO_MATCH; trùng `sepayTxId` → DUPLICATE bỏ qua; session
  hết hạn/hủy → review; sai API key → 401; chưa cấu hình key → 503.
- **BE unit:** `checkout/start` với `orderIds` con; unique `payCode`.
- **FE e2e (Playwright):** trạm in stub `window.print` (như `staff-receipt.spec.ts`) —
  nhận `payment_completed` (mock SSE/MSW) → gọi print đúng 1 lần, nội dung hóa đơn
  đủ món/tổng tiền; nút in lại; màn khách: không còn nút tự khai, nhận SSE → màn thành công.
- **Thủ công trước khi nghiệm thu:** chuyển khoản thật số tiền nhỏ qua SePay sandbox/
  tài khoản thật → hóa đơn in ra ở quầy.

## 9. Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| Khách sửa/ghi sai nội dung CK | Số tiền vẫn khớp session nào đó? KHÔNG đoán — đẩy cảnh báo đối soát tay (`payment_review_needed`), nhân viên xác nhận tay |
| SePay chậm/ngừng | Khách báo nhân viên → xác nhận tay như trước giờ; webhook về muộn cho session đã completed → ghi `NEEDS_REVIEW` + cảnh báo (nguy cơ thu 2 lần), không tự gạt lại |
| 2 bàn cùng số tiền chuyển cùng lúc | Khớp bằng payCode duy nhất, không khớp bằng số tiền đơn thuần |
| Trạm in tắt/Chrome crash | Thanh toán không phụ thuộc in; mở lại trạm → mục "in bù"; shortcut Startup |
| Chrome bỏ hỗ trợ kiosk-printing | Đường lui: nâng cấp lên print agent ESC-POS (Hướng C) không đổi kiến trúc BE |
