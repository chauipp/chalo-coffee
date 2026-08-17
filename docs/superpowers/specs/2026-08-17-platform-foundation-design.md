# Nền tảng an toàn và vận hành Chalo Coffee — Design Spec

Ngày: 2026-08-17

## Mục tiêu

Đưa Chalo Coffee từ mức MVP vận hành được lên nền tảng an toàn, có khả năng đối soát và phát triển tiếp: phiên đăng nhập không lộ cho JavaScript, realtime không truyền credential trên URL, CORS bị giới hạn đúng domain, release có cổng kiểm tra/backup/health và các dữ liệu nghiệp vụ nhạy cảm có lịch sử truy vết.

Đây là đợt đầu trong roadmap hoàn chỉnh. Các đợt phụ thuộc sau gồm: SePay, kho nguyên liệu, POS nâng cao, dashboard, loyalty/voucher và PWA offline.

## Bối cảnh và quyết định

### Các phương án phiên đăng nhập

1. Giữ JWT trong `localStorage`, chỉ sửa CORS và che log. Nhanh nhưng refresh token vẫn bị XSS đọc được; loại.
2. Backend-for-frontend tách riêng. An toàn, nhưng tạo thêm một service và luồng proxy lớn khi Chalo đã phục vụ API cùng domain qua Caddy; chưa cần.
3. JWT trong cookie `HttpOnly; Secure; SameSite=Strict`, backend đọc cookie hoặc Bearer khi API máy-máy cần dùng. Đây là phương án chọn.

`chalo_role` chỉ là cookie UI không nhạy cảm để Next middleware chọn màn hình mặc định. Backend vẫn xác thực role từ JWT với mọi API; sửa cookie này không cấp quyền. Access/refresh cookie được backend phát và xoá, JavaScript không được đọc. EventSource cùng origin tự gửi cookie nên bỏ hoàn toàn `?token=`.

### Các phương án thanh toán tự động

1. Khách tự bấm “đã chuyển khoản”: không đủ bằng chứng, loại.
2. Tích hợp từng ngân hàng: chi phí và bảo trì cao, loại.
3. Adapter SePay webhook, có pay-code, kiểm chữ ký, idempotency và hàng chờ đối soát. Chọn phương án này. Adapter ở trạng thái tắt nếu chưa cấu hình khoá; không có credential bí mật trong repo.

Một nhánh SePay đã có trong repo sẽ được kế thừa có chọn lọc, review lại và hợp nhất vào worktree này thay vì viết trùng.

### Mô hình dữ liệu vận hành tiếp theo

- **Payment audit**: giao dịch là bất biến; huỷ/hoàn là bản ghi reversal có reason, actor, approver và liên kết giao dịch gốc.
- **Inventory**: `Ingredient`, `StockMovement`, `ProductRecipe` và cảnh báo ngưỡng. Hoàn tất món/đơn tạo movement giao dịch an toàn; không âm kho.
- **Loyalty/promotion**: ledger điểm có earn/redeem/adjust; voucher có quota, thời hạn, điều kiện và việc dùng một lần. Không sửa số dư trực tiếp.

## Kiến trúc

```
Browser/PWA ─same-origin cookies─> Caddy ─> Nest API
       │                                │
       ├─ EventSource (cookie)          ├─ PostgreSQL: order/payment/audit/inventory
       └─ CSRF header                   ├─ SePay webhook (signature + idempotency)
                                        └─ SSE/pager + observability
```

### Biên module

- `auth`: phát/xoá cookie, refresh rotation, per-route throttle và CSRF.
- `payment`: checkout pay-code, SePay adapter, payment/reversal/audit.
- `inventory`: công thức, tồn, movement và cảnh báo; `order` chỉ gọi cổng `InventoryService.commitConsumption()` trong transaction.
- `operations`: hold/transfer/merge/split/discount với phân quyền.
- `analytics`: API aggregate riêng; dashboard không tính chỉ số trong client.
- `platform`: CORS, redacted structured logs, health liveness/readiness, metrics, CI/CD, backup/restore guide.

## Hành vi và tiêu chí chấp nhận đợt nền tảng

1. Production chỉ phản hồi CORS cho origin nằm trong `CORS_ORIGIN`; phát hiện origin khác phải không phát header credential.
2. Login/refresh/Google callback phát secure HttpOnly cookie. Logout xoá cookie và client cache session; không còn access/refresh token trong localStorage hay URL SSE.
3. SSE staff hoạt động sau login bằng cookie cùng origin; request logger không ghi query `token`, `clientSecret`, `refreshToken`, password hoặc key.
4. Login/register/refresh có throttle riêng; seed production không thể tạo account với mật khẩu mặc định.
5. `pnpm audit --prod` không còn advisory high; FE và BE build/test xanh.
6. CI chạy audit, type/build, unit và e2e trước deploy; deploy chỉ thành công sau smoke-test health. Tài liệu có backup PostgreSQL + uploads và quy trình restore đã thử được ở staging.
7. Health chia liveness (process) và readiness (DB); logs có request id, status/duration và đã redaction. Metrics Prometheus-compatible được bảo vệ bởi bearer token; request id là correlation id để nối với tracing khi cần bổ sung OpenTelemetry collector.

## Không thuộc đợt nền tảng

- Không đổi enum trạng thái đơn hiện hữu hoặc bắt buộc khách trả trước.
- Không cất API key, mật khẩu, dump DB hay backup thật vào git.
- Không làm offline write queue cho đến khi các mutation có idempotency key và conflict policy được hoàn tất ở đợt PWA.

## Kiểm thử

- Jest backend: origin allow-list, cookie flags, JWT cookie extractor, redaction, seed guard, throttle metadata và health handlers.
- Node unit frontend: auth state không persist credential; URL SSE không có query token.
- Playwright: login role → restart PWA → vào đúng dashboard/POS; SSE update; logout; desktop và 375×667 không lỗi console/network.
- CI: audit, build, unit và Playwright sau khi backend/frontend khởi động.

### Ma trận bằng chứng 2026-08-17

| Tiêu chí | Bằng chứng đã chạy |
| --- | --- |
| CORS allow-list | `chalo-be/src/config/cors.spec.ts` trong `pnpm test --runInBand` (147/147 pass) |
| Cookie/PWA/SSE | `auth-cookie`, `auth.controller`, `auth-session-source` và Playwright `auth-persistence.spec.ts` (2/2 pass) |
| Redaction/throttle/seed | `redact-request-url`, `auth.controller`, `seed.service` trong backend suite |
| Dependency production | `node scripts/audit-production-dependencies.mjs`: backend high=0/critical=0, frontend high=0/critical=0 |
| Health/metrics/log | `health.controller`, `metrics.controller`, `request-context.middleware` trong backend suite |
| Release/backup | `bash -n` + `shellcheck` (nếu có) hai script và `docker compose ... config` với biến môi trường mẫu |
| UI responsive | Chromium Playwright: admin khôi phục session ở desktop; staff khôi phục session/POS ở 375×667 |

## Rủi ro và vận hành

- Cookie HttpOnly yêu cầu API cùng site; Caddy hiện đã route `/api/*` trên cùng public domain nên phù hợp. Môi trường dev cross-port dùng proxy/rewrite hoặc cờ cookie không `Secure` duy nhất ở development.
- SePay cần key thực và URL HTTPS công khai do chủ quán cung cấp sau khi code đã deploy; hệ thống vẫn vận hành manual khi key chưa có.
- OAuth state và SSE hiện in-memory; trước khi scale nhiều backend instance, thêm Redis store/pubsub.

## Plan thực thi

Xem [kế hoạch nền tảng](../plans/2026-08-17-platform-foundation.md). Các kế hoạch tiếp theo chỉ bắt đầu sau khi đợt này đã được kiểm chứng.
