# Tổng kết PR an toàn ứng dụng

Liên quan: [spec thiết kế](../specs/2026-08-18-security-operations-foundation-design.md) · [kế hoạch](../plans/2026-08-18-security-operations-foundation.md)

## Đã làm gì

- Chỉ chấp nhận CORS credential từ domain được cấu hình và che query credential trước khi ghi request log.
- Bổ sung CSRF origin guard cho mutation dùng cookie phiên, đồng thời giới hạn thử login, register và refresh.
- Chặn seed production sử dụng mật khẩu mặc định hoặc yếu.
- Nâng dependency production, ép các dependency transitive bị cảnh báo lên bản an toàn và thêm audit production vào CI.
- Kiểm chứng PWA role session trên Chromium: 10/10 kịch bản admin, staff và customer pass.

## File chính

- `chalo-be/src/config/cors.ts` định nghĩa allow-list CORS dùng chung với CSRF.
- `chalo-be/src/common/middleware/csrf-origin.middleware.ts` bảo vệ mutation xác thực bằng cookie.
- `chalo-be/src/common/logging/redact-request-url.ts` loại credential khỏi URL log.
- `chalo-be/src/seed/seed.service.ts` bắt buộc secret seed production an toàn.
- `scripts/audit-production-dependencies.mjs` và `.github/workflows/ci.yml` biến audit, test và build thành cổng merge.

## Khác với plan

- Cấu hình override dependency transitive được đặt trong `chalo-be/pnpm-workspace.yaml`, vì pnpm 11 chỉ đọc override từ file này; không dùng trường `pnpm` trong `package.json`.
- Standalone server của Next không resolve được symlink dependency trong worktree, nên Playwright dùng `pnpm start` trên production build; kết quả kiểm chứng không đổi.

## Còn dở / cần lưu ý

- CI sẽ chạy ở pull request kế tiếp; cần quan sát lần chạy GitHub Actions đầu tiên sau khi tạo PR.
- Health/metrics, backup/restore và smoke/rollback deploy được cố ý để ở PR độ tin cậy vận hành riêng.
