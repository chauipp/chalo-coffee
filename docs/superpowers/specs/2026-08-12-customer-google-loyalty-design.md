# Thiết kế: tài khoản Google, phiên bàn và tích điểm khách hàng

## Mục tiêu

Cho phép khách đăng nhập bằng Google để tích điểm và tiếp tục gọi món tại bàn, nhưng không làm thay đổi luồng quét QR/gọi món hiện có của khách vãng lai. Trải nghiệm khách ưu tiên màn hình điện thoại.

Google chỉ tạo tài khoản `CUSTOMER`; tuyệt đối không thể dùng Google để nhận quyền `ADMIN` hoặc `MODERATOR`.

## Trạng thái hiện tại và vấn đề cần giải quyết

- Đơn hiện chỉ gắn với `tableToken`, không gắn với khách hay tài khoản.
- Giỏ hàng được lưu trong `localStorage` với `tableToken`; quét QR mới sẽ xóa giỏ của bàn trước.
- QR token là mã cố định in/dán tại mỗi bàn và không tự đổi khi thanh toán. Chỉ admin chủ động bấm “Tạo QR mới” mới sinh token khác. Vì QR cũ luôn có thể còn hợp lệ, không được dùng token lưu cục bộ làm bằng chứng khách còn ngồi tại bàn hôm sau.

## Nguyên tắc sản phẩm

1. Khách vãng lai vẫn mở QR và gọi món ngay, không bắt buộc tạo tài khoản.
2. Khách đăng nhập Google mới tích điểm; điểm không hết hạn trong phase này.
3. Giá trị điểm của đơn đã thanh toán là `floor(totalAmount / 1.000)`. Ví dụ 100.000đ cộng 100 điểm.
4. Một phiên bàn là dữ liệu phía server, gắn với tài khoản khách và bàn; không tin trạng thái localStorage để xác nhận đang ngồi bàn.
5. Sau khi mọi đơn của một khách đã thanh toán, ứng dụng chỉ giữ lối tắt về bàn đó trên chính tài khoản/thiết bị của khách trong tối đa 30 phút. Đây là tiện ích quay lại nhanh, không giữ chỗ, không khóa bàn và không xác định nhóm khách. Quá 30 phút không hoạt động sau lần thanh toán cuối, hoặc chậm nhất vào 00:00 theo giờ Việt Nam, lối tắt hết hiệu lực và khách phải quét QR lại.
6. Quét QR luôn dẫn thẳng vào menu bàn để gọi món, bất kể có khách/tài khoản khác vừa dùng bàn trong 30 phút hay không. Không hỏi “cùng nhóm hay nhóm mới”, không ghi đè hay đóng phiên của người khác.
7. Landing page chỉ hiện icon giỏ hàng/tiếp tục gọi món khi API xác nhận lối tắt của chính khách còn hiệu lực. Icon dẫn về menu bàn đó và có badge số món đang nằm trong giỏ cục bộ của đúng bàn đó.

## Phase 1 — Nền tảng dữ liệu và Google OAuth

### Mô hình dữ liệu

- Bổ sung định danh đăng nhập ngoài mật khẩu cho `users`: `googleSubject` (unique, nullable), `email` (unique, nullable), và lưu avatar Google nếu được cấp.
- Mật khẩu của tài khoản Google không được dùng để đăng nhập mật khẩu. Cột password hiện tại vẫn được điền chuỗi ngẫu nhiên đã băm để giữ tương thích schema; đăng nhập username/password chỉ hoạt động với tài khoản có username do hệ thống quản trị tạo.
- Thêm `customer_table_sessions`: `id`, `customerId`, `tableId`, `tableToken`, `status` (`ACTIVE`, `CLOSED`, `EXPIRED`), `startedAt`, `lastActivityAt`, `paidAt`, `endedAt`, `businessDate`, `endedReason`. Đây là lối tắt cá nhân của khách, không phải phiên sở hữu bàn; nhiều khách có thể đồng thời có bản ghi cho cùng một bàn.
- Thêm sổ cái `loyalty_point_transactions`: `id`, `customerId`, `orderId` (unique), `points`, `type` (`EARN`), `createdAt`. Số dư là tổng sổ cái, không lưu một biến điểm dễ lệch.
- Thêm `customerId` nullable vào `orders`. Đơn vãng lai tiếp tục có giá trị `null`; đơn trong phiên đăng nhập giữ khách đã tạo đơn.

### OAuth và API

- Backend dùng OAuth 2.0 Authorization Code Flow với PKCE/`state`: bắt đầu từ frontend, redirect sang Google, Google callback vào backend.
- Backend kiểm tra ID token do Google phát hành (issuer, audience/client ID, chữ ký, expiry, `email_verified`), tìm theo `googleSubject`; nếu chưa có thì tạo `CUSTOMER` mới.
- Backend phát access/refresh JWT đang dùng, nhưng callback không đặt token lên URL. Thay vào đó tạo mã chuyển tiếp dùng một lần, sống ngắn; frontend đổi mã lấy JWT qua HTTPS rồi lưu theo cơ chế hiện có.
- Biến môi trường mới: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `FRONTEND_URL`. Nếu thiếu, nút Google bị vô hiệu hóa với thông báo cấu hình chưa sẵn sàng; hệ thống đăng nhập cũ không bị ảnh hưởng.
- API khách được JWT bảo vệ: `GET /customer/me`, `GET /customer/table-session`, `POST /customer/table-session/scan`, `POST /customer/table-session/leave`, `GET /customer/loyalty` và `GET /customer/orders`.

### Bảo mật và quyền

- Callback chỉ chấp nhận state do server phát và chỉ dùng một lần.
- Chỉ chấp nhận redirect URL cố định từ biến môi trường, không nhận URL tùy ý từ client.
- Email Google là dữ liệu hồ sơ, còn `googleSubject` là định danh liên kết thật sự.
- Các API staff/admin và login password hiện hữu giữ nguyên phân quyền. `CUSTOMER` không có quyền gọi API vận hành.

## Phase 2 — Trải nghiệm khách trên mobile

### Màn hình và điều hướng

- Landing header giữ nút đăng nhập. Khi đã đăng nhập thì thay bằng avatar/tài khoản và icon giỏ hàng có điều kiện.
- Trang `Tài khoản`: tên/ảnh Google, điểm hiện có, hành động chính “Quét mã bàn”, trạng thái bàn hiện tại, nút “Tiếp tục gọi món”, lịch sử đơn gần đây và đăng xuất.
- Quét bàn dùng camera trên mobile với nhập mã/link thủ công làm dự phòng. Chỉ chấp nhận QR URL/token của bàn Chalo Coffee.
- QR quét lại đúng bàn hoặc bàn khác đều đi thẳng menu. Nếu khách đăng nhập, hệ thống cập nhật lối tắt cá nhân của họ sang QR vừa quét, không tác động đến khách khác tại bàn.
- Trang menu QR vãng lai: logo `CH` ở góc trên trái trở thành liên kết về landing page. Không làm gián đoạn gọi món và gọi nhân viên hiện có.
- Khi khách đã đăng nhập và menu được mở bằng QR, frontend gọi API scan để liên kết/khôi phục phiên bàn. Đơn tạo từ lúc đó gửi kèm JWT và backend gắn `customerId` theo phiên; nếu không đăng nhập vẫn tạo đơn công khai như cũ.
- Mở menu, thao tác giỏ hàng và tạo đơn trong một phiên đăng nhập đều cập nhật `lastActivityAt`. Hoạt động sau khi thanh toán cuối cùng giữ lối tắt cá nhân thêm 30 phút; nếu chính khách tạo đơn mới, mốc 30 phút của họ chỉ bắt đầu lại khi đơn mới đó thanh toán. Việc khách khác quét/call món ở cùng bàn không ảnh hưởng lối tắt này.

### UX chi tiết

- Mobile-first, vùng chạm tối thiểu 44px, đáy màn hình không che CTA bởi safe-area.
- Trạng thái đang quét, camera bị từ chối, QR sai/hết hạn, bàn đã kết thúc và offline đều có thông báo ngắn cùng hành động phục hồi.
- Không tự động chuyển khách sang bàn cũ chỉ dựa vào dữ liệu trình duyệt. Landing và trang tài khoản luôn lấy phiên đang hoạt động từ backend.
- Giỏ landing hiển thị badge chỉ khi `cart.tableToken` trùng phiên server; nếu không trùng thì không hiển thị số món và không chuyển nhầm bàn.

## Phase 3 — Thanh toán và cộng điểm

- Khi staff/admin ghi nhận thanh toán cuối cùng của một đơn, backend dùng transaction tạo đúng một giao dịch `EARN` cho `orderId`; unique constraint bảo đảm không cộng trùng khi bấm lại, thanh toán gộp hoặc retry.
- Chỉ cộng điểm cho đơn có `customerId` và đã thanh toán. Đơn hủy, đơn chưa trả tiền và khách vãng lai không có điểm.
- Khi đơn của một khách được thanh toán, backend đánh dấu `paidAt` trên lối tắt của chính khách đó nhưng chưa đóng ngay. Nếu khách không có hoạt động mới trong 30 phút, backend đóng bản ghi với lý do `IDLE_AFTER_PAID`; nếu chính khách tạo đơn mới, `paidAt` được làm mới sau lần thanh toán kế tiếp. Không thao tác lên lối tắt của khách khác cùng bàn. QR token của bàn được giữ nguyên; chỉ API quản trị “Tạo QR mới” mới thay token và yêu cầu in lại QR.
- Staff/admin thấy tên khách (nếu có) và số điểm cộng dự kiến/thành công trong chi tiết đơn. Không để lộ email hay dữ liệu không cần thiết trên màn vận hành.
- Tài khoản khách làm mới số điểm và lịch sử sau thanh toán qua refetch; realtime/SSE có thể bổ sung sau, không là điều kiện của phase này.

## Phase 4 — Hoàn thiện, dữ liệu cũ và vận hành

- Migration TypeORM có khả năng rollback; đơn dữ liệu cũ giữ `customerId = null` và không hồi tố điểm.
- Job/lazy guard hết hạn phiên: mọi truy vấn phiên active đều kiểm `businessDate` theo VN và `paidAt + 30 phút <= now` khi không có hoạt động sau thanh toán; một cron định kỳ đóng phiên cũ để dữ liệu sạch, nhưng độ đúng không phụ thuộc cron.
- Admin có danh sách khách/điểm đọc-only ở phase này nếu chi phí UI hợp lý; không có chức năng đổi điểm hay trừ điểm.
- Thêm audit log tối thiểu cho callback OAuth thất bại, lỗi liên kết bàn và giao dịch điểm.
- Viết hướng dẫn cấu hình Google Cloud: OAuth consent screen, authorized JavaScript origins, redirect URI production/staging, và các biến môi trường trên VPS. Không commit secret.

## Luồng chính

```text
Khách vãng lai: QR bàn → Menu công khai → Đơn không gắn khách → Thanh toán

Khách Google: Landing → Google OAuth → Tài khoản → Quét QR → Phiên bàn server
  → Menu → Đơn gắn customerId → Thanh toán → ledger + floor(tổng/1000) điểm
  → đóng phiên → landing không còn icon giỏ
```

## Phạm vi không làm trong đợt này

- Đặt ship, thanh toán trước online và dùng điểm để đổi ưu đãi.
- Tự tạo tài khoản khách bằng username/password.
- Chuyển quyền admin/staff qua Google.
- Hồi tố điểm cho đơn lịch sử.

## Kiểm thử và tiêu chí nghiệm thu

- Unit/integration: xác minh Google token/state, tạo/lấy đúng khách, lối tắt độc lập giữa nhiều khách cùng bàn, hết hạn qua ngày VN, hết hạn sau 30 phút không hoạt động kể từ thanh toán, gia hạn khi chính khách gọi thêm món, quét bàn khác không ảnh hưởng khách khác, tính điểm làm tròn xuống và idempotency giao dịch điểm.
- E2E/Playwright mobile: từ landing đăng nhập (mock OAuth), quét QR/nhập token, tiếp tục menu, icon giỏ, QR sai, phiên qua ngày và logout.
- Regression: luồng QR vãng lai, staff/admin password login, đặt đơn/thanh toán hiện hữu đều xanh.
- Chỉ bật production khi Google OAuth đã cấu hình callback HTTPS đúng tại `chalocoffee.com` và có thử nghiệm tài khoản thật.

## Quyết định đã chốt

- Google login tạm thời dành cho khách hàng.
- Điểm không hết hạn.
- Khách vãng lai vẫn đặt món bằng QR như hiện tại.
- Tích điểm sau thanh toán, tỷ lệ 1 điểm/1.000đ, làm tròn xuống.
- QR mỗi bàn là cố định; chỉ admin chủ động tạo lại QR mới được đổi token.
- Sau thanh toán, chỉ lối tắt về bàn của chính khách tự đóng sau 30 phút không hoạt động; nó không giữ bàn và không ảnh hưởng khách khác quét cùng QR.

## Plan thực thi

Plan chi tiết sẽ được viết sau khi duyệt spec này: [2026-08-12-customer-google-loyalty.md](../plans/2026-08-12-customer-google-loyalty.md).
