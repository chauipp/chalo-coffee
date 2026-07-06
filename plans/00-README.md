# Chalo Coffee — Kế hoạch hoàn thiện ứng dụng

Bộ plan này triển khai **toàn bộ chức năng còn lại** theo spec (`chalo-fe/chalo-description.md`) và audit (`plan.md`). Mỗi file là một plan độc lập, chia thành các task nhỏ (2–5 phút/step) theo TDD + commit thường xuyên, để có thể giao cho subagent thực thi từng task một.

## Thứ tự thực hiện & phụ thuộc

Backend trước, Frontend sau (FE cần endpoint của BE).

| # | Plan | Phân hệ | Phụ thuộc |
|---|------|---------|-----------|
| 01 | [01-critical-fixes.md](01-critical-fixes.md) — gate seed service + `.env.example` | Infra | — (làm **ĐẦU TIÊN**, chống mất dữ liệu) |
| 02 | [02-be-registration.md](02-be-registration.md) — `POST /auth/register` công khai | BE | — |
| 03 | [03-be-settings.md](03-be-settings.md) — bảng Settings + toggle thời gian chờ | BE | — |
| 04 | [04-be-pager-token.md](04-be-pager-token.md) — entity + API Thẻ bàn | BE | — |
| 05 | [05-fe-customer-checkout-register.md](05-fe-customer-checkout-register.md) — checkout gộp + trang đăng ký | FE khách | 02 |
| 06 | [06-fe-staff-pager-receipt.md](06-fe-staff-pager-receipt.md) — UI thẻ bàn + in hóa đơn | FE nhân viên | 04 |
| 07 | [07-fe-admin-dashboard.md](07-fe-admin-dashboard.md) — dashboard biểu đồ doanh thu | FE admin | — (BE stats đã có) |
| 08 | [08-fe-admin-staff-settings-orders.md](08-fe-admin-staff-settings-orders.md) — trang Nhân viên + Cài đặt + Đơn hàng | FE admin | 03 (cho trang Cài đặt) |
| 09 | [09-cleanup.md](09-cleanup.md) — xóa code chết + kiểm tra tổng thể | Cả hai | làm **CUỐI CÙNG** (sau 01–08) |

**Đường tới hạn:** 01 → 02/03/04 (song song được) → 05/06/07/08 (song song được) → 09.

## Quyết định kỹ thuật đã chốt (default hợp lý)

- **Settings** lưu **bảng DB 1 dòng qua TypeORM** (không dùng Redis/file) — đã có sẵn TypeORM.
- **Dashboard** dùng **recharts** (task đầu của plan 07 cài nếu chưa có).
- **In hóa đơn** dùng **browser print API** (`window.print()` + CSS `@media print`), không phụ thuộc máy in nhiệt.
- **Đăng ký khách**: cân nhắc trong plan 02 (hôm nay chỉ có role ADMIN/MODERATOR) — plan chọn cách đơn giản đúng đắn và ghi rõ.

Nếu bạn muốn khác (VD Redis cho settings, thư viện chart khác, tích hợp máy in nhiệt), báo trước khi thực thi.

## Ràng buộc chung (áp dụng mọi plan FE)

⚠️ **Frontend là bản Next.js đã CHỈNH SỬA** (theo `chalo-fe/AGENTS.md`): API/quy ước có thể khác Next.js chuẩn. **Trước khi viết bất kỳ code FE nào, phải đọc guide liên quan trong `chalo-fe/node_modules/next/dist/docs/`.**

- Bám theo pattern có sẵn: service + React Query hook trong `chalo-fe/src/services`, UI kit trong `src/components/shared/ui`, auth store Zustand, `lib/api-client.ts`.
- BE: theo pattern module/controller/service/entity + DTO class-validator có sẵn; guard `@Roles`/`@Public` đúng convention.
- Commit nhỏ và thường xuyên; mỗi task kết thúc bằng một deliverable test được.

## Ghi chú nhất quán giữa các plan (đã self-review)

- **Đăng ký (02↔05):** contract khớp — `{username,password,fullName}` → `{accessToken,refreshToken,user}`. Đăng ký dùng `username` (bảng `users` không có cột email); cần thêm role `CUSTOMER` + migration enum.
- **Settings (03↔08):** khớp — `{waitTimeEnabled, baristaCount}`, `GET /settings` public, `PUT /settings` ADMIN.
- **Pager (04↔06):** plan 06 viết trước khi 04 có, ban đầu đoán 2 trạng thái. **Đã reconcile** trong 06 (banner đầu file): dùng contract thật của 04 — routes `GET /pager/list`, `POST /pager/assign|call|release`, trạng thái `WAITING|ASSIGNED|COMPLETED`, và thêm nút "Gọi/Sẵn sàng" (`/pager/call`). Khi làm plan 06 phải theo banner này.
- **Bug tiện thể phát hiện** (sửa trong plan tương ứng): `docker-compose.yml` lệch tên biến env FE (plan 01); type `RevenueDataPoint.label` nhưng BE trả `date` (plan 07).

## Ngoài phạm vi (mục nhỏ/tùy chọn, chưa đưa vào plan)

Các mục "LOW/edge" trong `plan.md` Section B, có thể làm sau nếu cần:
- Tự động nhận diện bàn khi khách vào thẳng URL không qua QR (auto table detection).
- Nút "giải phóng bàn" thủ công phía nhân viên (hiện release tự động sau thanh toán).
- Phân trang trang bàn phía nhân viên khi số bàn lớn.

Báo nếu bạn muốn bổ sung plan cho các mục này.

## Cách thực thi

Mỗi plan có checkbox `- [ ]` cho từng step. Chạy tuần tự theo bảng trên. Có thể:
- Giao cho tôi thực thi từng plan (subagent-driven: mỗi task 1 subagent, review giữa các task), hoặc
- Tự làm theo checklist.

> Nguồn: `chalo-fe/chalo-description.md` (spec), `plan.md` (audit), code thật trong `chalo-be/src` + `chalo-fe/src`, và knowledge graph `graphify-out/`.
