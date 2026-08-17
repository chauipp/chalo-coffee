# Tổng kết nền tảng an toàn và vận hành

Liên quan: [spec thiết kế](../specs/2026-08-17-platform-foundation-design.md) · [plan thực thi](../plans/2026-08-17-platform-foundation.md)

## Đã làm gì

- Chuyển phiên browser sang cookie HttpOnly, bỏ JWT khỏi localStorage và URL SSE; PWA mở lại tự đi về Dashboard (admin) hoặc POS (staff).
- Giới hạn CORS theo allow-list, che query nhạy cảm trong log, siết seed production và throttle cho endpoint auth.
- Loại toàn bộ advisory high/critical ở dependency production, đồng thời thêm script audit làm cổng CI/deploy.
- Bổ sung liveness/readiness, metrics có bearer token, request id trong log, healthcheck Docker và smoke/rollback trong deploy.
- Thêm workflow CI, backup PostgreSQL + uploads có checksum và quy trình restore staging có xác nhận rõ ràng.

## File chính

- `chalo-be/src/modules/auth/auth-cookie.ts` phát/xóa cookie phiên browser và giữ Bearer cho client máy-máy.
- `chalo-be/src/common/middleware/csrf-origin.middleware.ts` chặn mutation cookie-session từ origin không tin cậy.
- `chalo-be/src/modules/health/*` tách health, xuất metrics và gắn request-id/metrics vào request lifecycle.
- `.github/workflows/ci.yml` và `.github/workflows/deploy.yml` tạo cổng kiểm tra trước deploy và smoke-test sau deploy.
- `scripts/backup-postgres.sh`, `scripts/restore-postgres.sh`, `deploy/BACKUP_AND_RECOVERY.md` là quy trình sao lưu/khôi phục có guardrail.

## Khác với plan

- Browser test dùng API stub cho luồng cookie/PWA để kiểm chứng routing, responsive và không-persist credential độc lập với dữ liệu local; backend cookie, CSRF và health được kiểm chứng bằng suite Nest. Không thể chạy một E2E backend thật trong workspace vì PostgreSQL local từ chối credential hiện có.
- Metrics hiện ở Prometheus plaintext có token, chưa cài SDK/exporter OpenTelemetry đầy đủ; request id đã sẵn sàng để correlation khi triển khai collector.

## Còn dở / cần lưu ý

- Trước khi deploy production, phải đặt `METRICS_TOKEN`, `SEED_ADMIN_PASSWORD` và `SEED_STAFF_PASSWORD` nếu bật seed; tên Docker container trong hướng dẫn backup cần khớp stack thực tế.
- Cần thực hiện một restore drill trên staging với dữ liệu thật sau khi có môi trường staging. OAuth state và SSE vẫn in-memory, nên cần Redis nếu scale nhiều backend instance.
