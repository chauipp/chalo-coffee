# Báo cáo tổng quan — Chalo Coffee

> Tổng hợp từ spec gốc (`chalo-fe/chalo-description.md`) + audit hiện trạng (`plan.md`).
> Mô tả **ứng dụng khi hoàn thành** (tầm nhìn đầy đủ), có đánh dấu trạng thái để bạn biết cái nào đã có, cái nào còn thiếu.
>
> Chú thích trạng thái: ✅ đã làm · 🟡 làm dở/thiếu · 🔴 chưa có

---

## 1. Mục đích ứng dụng

**Chalo Coffee** là phần mềm **quản lý vận hành quán cà phê**. Cốt lõi là **số hóa quy trình phục vụ**:

- **Khách tự gọi món tại bàn bằng QR** (Dine-in QR Ordering) — không cần tải app, chỉ quét là vào menu.
- **Màn hình POS nghiệp vụ tại quầy** cho nhân viên.
- Mục tiêu: **tối ưu nhân lực, giảm sai sót, nâng trải nghiệm khách**.

Kiến trúc: **Backend NestJS** (`chalo-be`) + **Frontend Next.js** (`chalo-fe`), DB **PostgreSQL 16**, có **Redis 7** (hiện chưa dùng, để dành). Cập nhật real-time qua **SSE**.

Hệ thống có **3 phân hệ / vai trò**: Khách hàng · Nhân viên (Moderator) · Quản trị viên (Admin).

---

## 2. 👤 PHÂN HỆ KHÁCH HÀNG (Customer)

Web-app di động, truy cập qua trình duyệt. Không đăng nhập vẫn gọi món được (endpoint `@Public()`).

| Chức năng | Mô tả | Trạng thái |
|---|---|---|
| Quét QR vào menu | Quét mã tại bàn → tự nhận diện bàn → vào thẳng thực đơn | ✅ |
| Xem menu theo danh mục | Đồ uống chia danh mục, có ảnh + mô tả + giá | ✅ |
| Giỏ hàng & đặt món | Chọn số lượng, ghi chú, đặt đơn | ✅ |
| Ước tính thời gian chờ | Cộng dồn prep-time các đơn đang có → hiển thị "~15 phút" trước khi đặt | ✅ |
| Xem đơn của bàn | Danh sách đơn đang hoạt động + chi tiết từng đơn | ✅ |
| Gửi yêu cầu thanh toán | Bấm từ điện thoại → quầy nhận thông báo | ✅ |
| Thanh toán (1 đơn / tất cả) | Pay từng đơn hoặc pay-all cả bàn | ✅ |
| **Checkout gộp (quét 1 lần, trả hết)** | BE có `checkout/preview·start·complete` nhưng **FE chưa nối trang** | 🟡 |
| **Đăng ký / đăng nhập thành viên** | Tiền đề cho hệ thống **tích điểm/Loyalty** giai đoạn sau. Hiện tạo user là admin-only, chưa có trang đăng ký khách | 🔴 |

---

## 3. 👨‍🍳 PHÂN HỆ NHÂN VIÊN — Quầy thu ngân / Pha chế (Moderator / Staff)

Dashboard trên PC hoặc tablet. Cần đăng nhập, vai trò `MODERATOR`.

| Chức năng | Mô tả | Trạng thái |
|---|---|---|
| POS tại quầy (Counter POS) | Màn hình cảm ứng gọi món nhanh cho khách order trực tiếp | ✅ |
| Bảng Kanban đơn hàng real-time | 4 cột theo luồng trạng thái, kéo-thả, **âm thanh + popup** khi có đơn mới (qua SSE) | ✅ |
| Cập nhật trạng thái đơn | Chuyển trạng thái theo luồng có kiểm soát (`STATUS_TRANSITIONS`) | ✅ |
| Quản lý bàn | Xem trạng thái bàn + đơn đang hoạt động, drawer chi tiết | ✅ |
| Tiếp nhận & xác nhận thanh toán | Xử lý yêu cầu tính tiền, xác nhận để giải phóng bàn (tự về "Trống") | ✅ |
| **Quản lý Thẻ bàn (Pager Token)** | Khách gọi tại quầy → phát thẻ số (VD thẻ 12), theo dõi thẻ đang dùng / đã thu hồi. **Chưa có entity, API, UI** | 🔴 |
| **In hóa đơn (Receipt)** | "In tạm tính" để khách kiểm tra + "In hóa đơn" thanh toán cuối. **Chưa làm** | 🔴 |
| Nút "giải phóng bàn" thủ công | Hiện release bàn là tự động sau thanh toán; thiếu nút thủ công cho ca lẻ | 🟡 |

**Luồng trạng thái đơn (thực tế trong code):**
`PENDING → CONFIRMED → PREPARING → READY → COMPLETED` (+ `CANCELLED`).
Spec ghi gọn hơn (Chờ xác nhận → Đang pha chế → Đã phục vụ → Hoàn thành) — chỉ là khác nhãn, code chi tiết hơn nên tốt hơn.

---

## 4. 🛠️ PHÂN HỆ QUẢN TRỊ (Admin / Chủ quán)

Quyền cao nhất, vai trò `ADMIN`. Sidebar 6 mục: Dashboard · Menu · Đơn hàng · Bàn · Nhân viên · Cài đặt.

| Chức năng | Mô tả | Trạng thái |
|---|---|---|
| Quản lý danh mục | CRUD danh mục | ✅ |
| Quản lý sản phẩm | CRUD + đặt **prep-time** (cơ sở tính thời gian chờ) + bật/tắt tồn kho (Còn hàng/Hết hàng → ẩn/mờ trên app khách) | ✅ |
| Quản lý bàn & sinh QR | Khởi tạo bàn, tự sinh mã QR duy nhất mỗi bàn để in dán (qua `api.qrserver.com`) | ✅ |
| API báo cáo doanh thu | Doanh thu theo ngày/tuần/tháng + top món bán chạy (BE đã có) | ✅ (BE) |
| **Dashboard báo cáo** | Trang FE còn là **stub** ("Phrase 7 - chart"). Chưa có biểu đồ doanh thu, thẻ thống kê, top sản phẩm — dù BE đã sẵn endpoint | 🔴 |
| **Quản lý nhân sự** | Cấp tài khoản + phân quyền nhân viên (Mod). BE có đủ API user; **FE chưa có trang** `admin/staff` | 🔴 |
| **Trang cài đặt** | Có link nhưng **chưa có trang** | 🔴 |
| **Công tắc thời gian chờ (toàn cục)** | Admin bật/tắt hiển thị thời gian chờ trên app khách (đông thì bật, vắng thì tắt). Hiện `ESTIMATED_WAIT_BARISTAS` **hardcode**, chưa có toggle runtime | 🔴 |
| **Trang danh sách đơn (admin)** | Lọc theo trạng thái/ngày/bàn, phân trang. BE có `GET /order/page`; **FE chưa có trang** | 🟡 |

---

## 5. Nền tảng chung (Cross-cutting)

- **Auth:** JWT + refresh token, phân quyền theo vai trò + permission. Guard toàn cục (`JwtAuthGuard`, `RolesGuard`). ✅
- **Vai trò:** chỉ 2 — `ADMIN`, `MODERATOR` (khách không cần tài khoản để gọi món). ✅
- **Real-time:** SSE (`/order/events`) — 5 loại sự kiện: đơn mới, yêu cầu thanh toán, đổi trạng thái, thanh toán xong. Frontend dùng hook `useSSE` tự reconnect. ✅
- **Entities chính:** User, Category, Product, Table, Order, OrderItem, CheckoutSession. (Chưa có PagerToken.)
- **Seed dữ liệu:** 25 bàn, 250 đơn, 6 danh mục, 50+ sản phẩm. ✅
- **Docker:** PostgreSQL + Redis + BE + FE. ✅ (Redis chạy nhưng **chưa dùng**.)

---

## 6. ⚠️ Rủi ro / vấn đề cần lưu ý

| Vấn đề | Mức độ |
|---|---|
| **Seed service xóa sạch DB mỗi lần khởi động** (`onModuleInit` truncate toàn bộ bảng rồi seed lại) — sẽ **phá dữ liệu production**. Cần gate bằng env `SEED_ON_STARTUP` | 🔴 Nghiêm trọng |
| Chưa có `.env.example` / tài liệu biến môi trường | 🟡 |
| QR phụ thuộc API ngoài (`api.qrserver.com`) — sập là mất QR | 🟡 |
| Token SSE truyền qua query param (bị log bởi proxy) — chấp nhận được ở MVP | 🟡 |
| Route SSE mock ở FE (`api/sse/orders/route.ts`) là code chết — nên xóa | 🟢 |
| Chưa có e2e test cho FE | 🟡 |

---

## 7. Tóm tắt: còn gì để "hoàn thành"?

Ứng dụng **cốt lõi đã chạy** (khách gọi món QR, POS quầy, Kanban real-time, thanh toán, quản lý menu/bàn). Để đạt bản hoàn chỉnh theo spec còn **9 hạng mục chính**:

**Backend:**
1. 🔴 Gate seed service (chống mất dữ liệu) — *ưu tiên cao nhất, làm trước mọi thứ*
2. 🔴 Endpoint đăng ký khách (`@Public()`) — tiền đề Loyalty
3. 🔴 Entity + API **Pager Token**
4. 🔴 Endpoint **settings** (toggle thời gian chờ + số barista)

**Frontend khách:**
5. 🟡 Trang **checkout gộp** (nối BE đã có)
6. 🔴 Trang **đăng ký thành viên**

**Frontend nhân viên:**
7. 🔴 UI **quản lý thẻ bàn (Pager)**
8. 🔴 Component **in hóa đơn** (tạm tính + cuối)

**Frontend admin:**
9. 🔴 **Dashboard** (biểu đồ doanh thu, thống kê) · trang **Nhân viên** · trang **Cài đặt** · trang **Đơn hàng**

> Thứ tự triển khai chi tiết đã có trong `plan.md` (Section C, Phase 1→6).

---

*Nguồn: `chalo-fe/chalo-description.md` (spec), `plan.md` (audit 2026-06-30), enums & controllers trong `chalo-be/src`.*
