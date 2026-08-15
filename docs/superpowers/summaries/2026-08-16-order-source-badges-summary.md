# Kết quả: Order source badges

Liên quan: [spec](../specs/2026-08-16-order-source-badges-design.md) · [plan](../plans/2026-08-16-order-source-badges.md).

## Đã làm gì

- Đơn mới tự lưu nguồn tin cậy `QR` hoặc `POS`; dữ liệu cũ nhận `N/A` qua migration.
- Admin board và khu pha chế hiển thị badge nguồn có nhãn đọc được; đơn quầy vẫn hiện riêng số thẻ pager.
- Dữ liệu nguồn được giữ nguyên khi gom đơn theo bàn hoặc theo món trong khu pha chế.
- Bổ sung E2E production kiểm QR, Quầy, `Thẻ #12`, N/A, prep dock theo bàn và màn hình 375×667.
- Xác nhận E2E không có console error hay response 4xx/5xx cho các request của trang.

## File chính

- `chalo-be/src/migrations/1784365811595-OrderSource.ts`: thêm cột/enum nguồn đơn và backfill dữ liệu lịch sử.
- `chalo-be/src/modules/order/order.service.ts`: suy ra nguồn từ vai trò đã xác thực và trả về DTO.
- `chalo-fe/src/components/orders/OrderSourceBadge.tsx`: tập trung nhãn tiếng Việt, aria-label và kiểu badge.
- `chalo-fe/src/app/(staff)/_components/PrepTableCard.tsx`: hiện nguồn trên card theo bàn ở khu pha chế.
- `chalo-fe/e2e/order-source-badges.spec.ts`: fixture browser và kiểm chứng desktop/mobile.

## Khác với plan

Không lệch về chức năng. Server production được chạy bằng Next standalone thay cho `pnpm start` vì cấu hình `output: standalone` của dự án không hỗ trợ `next start`.

## Còn dở / cần lưu ý

Không.
