# In QR hàng loạt — 4 thẻ/tờ A4, 2 mặt khớp để cắt

Ngày: 2026-07-19 · Nhánh: `worktree-qr-card-intro-text`

## Mục tiêu
Cho phép admin chọn nhiều bàn rồi in ra tờ **A4**, mỗi mặt **4 thẻ QR khổ A6** (lưới 2×2).
In **2 mặt**: mặt sau đảo vị trí sao cho sau khi in 2 mặt + cắt rời, **mặt trước và mặt sau của cùng một bàn nằm chồng khít** lên nhau.

## Quyết định đã chốt (từ brainstorm)
1. **Nội dung 2 mặt = giống hệt** — cả 2 mặt là thẻ QR A6 đầy đủ của cùng một bàn (thẻ lều đứng, quét được cả 2 phía).
2. **Kích thước = đúng A6 sát mép** (105×148mm). 4 thẻ = 210×296mm trên giấy A4 (210×297mm) → in **tràn lề (borderless)**.
3. **Chọn bàn = checkbox trong bảng "Bàn & QR"** + thanh thao tác có nút in.
4. **Kiểu lật 2 mặt = toggle trên trang in** (mặc định *cạnh dài*), để người dùng thử cho khớp máy in.

## Kiến trúc & thành phần

### A. Chọn bàn — `app/(admin)/admin/tables/page.tsx` (sửa)
- Thêm state `selectedIds: Set<string>`.
- Thêm **cột checkbox** đầu bảng (header "" hoặc "Chọn"), mỗi dòng toggle 1 id.
- **Thanh thao tác** hiện khi `selectedIds.size > 0`: `Đã chọn N bàn · [Chọn tất cả] [Bỏ chọn] · 🖨️ In QR (4 bàn/tờ)`.
- Nút in: `window.open('/admin/tables/print-sheet?ids=' + [...selectedIds].join(','), '_blank')` (giữ đúng thứ tự chọn theo thứ tự trong bảng).
- Không sửa `DataTable` dùng chung (header chỉ nhận string) → checkbox chọn-tất-cả đặt ở thanh thao tác, không đặt ở header bảng.

### B. Trang in hàng loạt — route mới `app/(print)/admin/tables/print-sheet/`
- `page.tsx` (client): đọc `ids` từ query, `useGetTableList()`, lọc + giữ thứ tự, dựng `menuUrl` như trang in đơn (`${origin}/menu/${qrToken}`).
- Toolbar (chỉ màn hình, ẩn khi in): toggle **kiểu lật** (Cạnh dài / Cạnh ngắn), nút **In trang này**, ghi chú *bật Borderless + tỉ lệ 100% + in thử 1 tờ*.
- Với mỗi "tờ" (4 bàn): render **2 trang A4** — mặt trước rồi mặt sau. Thứ tự trang toàn cục: `Tờ1-trước, Tờ1-sau, Tờ2-trước, Tờ2-sau, …` (khớp in 2 mặt tự động).

### C. Logic thuần (tách để test) — `print-sheet/sheet-layout.ts`
- `chunkSheets<T>(items: T[], size = 4): (T | null)[][]` — chia 4/tờ, đệm `null` cho ô trống ở tờ cuối.
- Kiểu lật: `type FlipMode = 'long' | 'short'`.
- `backOrder(mode: FlipMode): number[]` — trả hoán vị chỉ số ô cho mặt sau:
  - `long`  → `[1, 0, 3, 2]` (đảo cột), thẻ **để đứng**.
  - `short` → `[2, 3, 0, 1]` (đảo hàng), mỗi thẻ **xoay 180°**.
- `needsRotate180(mode): boolean` — `true` khi `short`.
- Mặt trước luôn theo thứ tự `[0, 1, 2, 3]` → vị trí `TL, TR, BL, BR`.

### D. Một mặt A4 — `print-sheet/A4Face.tsx`
- Props: `cells: ({ table, menuUrl } | null)[]` (đúng 4 phần tử, theo thứ tự ô), `rotate180: boolean`, `showCutMarks: boolean`.
- Render `.a4-sheet` (210×297mm) chứa `.a4-grid` 2×2 (mỗi ô 105×148mm). Mỗi ô bọc `<QrA6Sheet>` (ô `null` → để trống). Nếu `rotate180` → bọc `.rot180 { transform: rotate(180deg) }`.
- **Vạch cắt** (khi `showCutMarks`): đường mảnh giữa tờ (dọc x=105mm, ngang y=148mm) + khung mép — luôn nằm trong giấy để căn cắt.

### E. Tái dùng CSS — `A6_PRINT_CSS` (sửa nhỏ)
- Chuyển rule `@page { size: 105mm 148mm; margin: 0 }` **ra khỏi** `A6_PRINT_CSS` (vì trang sheet cần `@page A4`).
- Trang in đơn hiện tại tự khai `@page` A6 trong style riêng của nó.
- Trang sheet khai `@page { size: A4 portrait; margin: 0 }` + CSS lưới A4 + `page-break-after: always` giữa các trang.
- Phần CSS thẻ (`.qr-sheet`, `.cell-*`, `.intro-tagline`, …) giữ nguyên, dùng chung.

### F. Preview không cần backend — `/qr-preview` (mở rộng tạm)
- Thêm khối demo dàn 4-up **cả 2 mặt** với 3–4 bàn mẫu để duyệt trực quan ở port 3007.
- ⚠️ File preview vẫn là **tạm — xóa trước khi merge**.

## Edge cases
- `ids` rỗng / không khớp bàn nào → hiện thông báo "Không có bàn để in".
- 1–3 bàn → 1 tờ, ô thừa để trống (giữ vị trí).
- Số bàn không chia hết 4 → tờ cuối có ô trống.
- Bàn chưa có `qrToken`/`origin` chưa sẵn → ô trống/th chờ (giống trang in đơn).

## Kiểm thử
- **Unit** (`sheet-layout.test.ts`): `chunkSheets` (chia đúng, đệm null), `backOrder('long') === [1,0,3,2]`, `backOrder('short') === [2,3,0,1]`, `needsRotate180`.
- **Visual**: Playwright chụp `/qr-preview` (khối 4-up 2 mặt) trên port 3007, mắt kiểm tra vị trí đảo + vạch cắt.

## Ngoài phạm vi (YAGNI)
- Lọc bàn theo khu vực khi chọn (có thể thêm sau).
- Lưu cấu hình kiểu lật vào Settings.
- Tự động scale "thu vừa vùng in" (chỉ thêm nếu in thử bị cụt mép).
