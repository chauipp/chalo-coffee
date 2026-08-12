# Landing floating actions — kết quả

**Spec:** [2026-08-12-landing-floating-actions-design.md](../specs/2026-08-12-landing-floating-actions-design.md)

**Plan:** [2026-08-12-landing-floating-actions.md](../plans/2026-08-12-landing-floating-actions.md)

## Đã làm gì

- Thêm hai icon tròn nổi cố định ở góc phải dưới cho Nhắn Zalo và Chỉ đường.
- Bổ sung tooltip trên desktop để làm rõ chức năng mà không thêm chữ cố định trên mobile.
- Tự động nâng cụm icon lên khi thanh CTA mobile xuất hiện, tránh che thao tác bên dưới.
- Bổ sung kiểm thử link, accessibility name và trạng thái không tràn ngang.

## File chính

- `chalo-fe/src/app/_components/PublicLanding.tsx`: SVG Zalo và cụm floating actions có hành vi theo dock mobile.
- `chalo-fe/e2e/public-landing.spec.ts`: xác nhận action links và bố cục mobile.

## Khác với plan

Không lệch.

## Còn dở / cần lưu ý

Không.
