# Locator Playwright bắt nhầm phần tử ẩn bằng CSS (vẫn còn trong DOM)

## Khi nào gặp lại

Viết e2e cho `chalo-fe`, dùng locator toàn trang kiểu `page.getByLabel(...)`,
`page.getByText(...)` mà Playwright báo `strict mode violation: resolved to 2
elements` — trong đó một phần tử thuộc layout dùng chung (sidebar admin,
mobileCard của bảng responsive...) chỉ ẩn bằng class Tailwind như `md:hidden`
hoặc `hidden md:table-row`, không phải điều kiện render nên vẫn luôn nằm
trong DOM dù đang chạy ở viewport desktop.

Ví dụ đã gặp:
- `<article>` mobileCard của bảng nhân viên/khách hàng (`DataTable.tsx`).
- Nút `aria-label="Đóng menu"` của sidebar mobile trùng tên gần giống nút
  `aria-label="Đóng"` của dialog chi tiết khách hàng.

## Cách làm đúng

Luôn scope locator vào container cụ thể (dòng bảng `tr`, hộp thoại `dialog`,
...) trước khi tìm phần tử con, thay vì gọi trực tiếp trên `page`:

```typescript
const row = page.locator("tr", { hasText: `@${username}` });
const dialog = page.getByRole("dialog", { name: "..." });
await dialog.getByLabel("Đóng").click();   // đúng — scope vào dialog
// await page.getByLabel("Đóng").click(); // sai — có thể trùng nút layout dùng chung
```

## Cái bẫy

Layout admin của dự án này render sẵn toàn bộ phần tử cho cả hai breakpoint
(desktop + mobile) và chỉ ẩn/hiện bằng CSS (`md:hidden`, `hidden md:table-row`
...), không dùng conditional render theo JS. Vì vậy `page.getBy*` toàn trang
luôn có rủi ro khớp nhầm bản sao ẩn, mà lỗi chỉ lộ ra khi chạy thật (không
lint/tsc nào bắt được), và tên/label của các bản sao đó nhiều khi rất giống
nhau (`"Đóng"` vs `"Đóng menu"`) nên dễ nghĩ locator đã đủ cụ thể.

## Kiểm thế nào là đúng

Chạy spec bằng `npx playwright test <file>.spec.ts --project=chromium`. Nếu
còn lỗi `strict mode violation: resolved to N elements`, đọc danh sách phần tử
Playwright liệt kê trong lỗi — luôn có gợi ý locator khác biệt (ví dụ
`aka getByLabel('Đóng menu')`) để chọn scope hẹp hơn.
