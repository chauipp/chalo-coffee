# Tổng kết: tồn kho nguyên liệu và công thức món

Liên quan: [spec](../specs/2026-08-17-inventory-recipes-design.md) · [plan](../plans/2026-08-17-inventory-recipes.md)

## Đã làm gì

- Thêm nguyên liệu, công thức món và sổ biến động tồn kho chỉ ghi thêm; nhập, điều chỉnh, bán và hủy đơn đều để lại lịch sử.
- Đơn hàng khóa và trừ nguyên liệu trong transaction; thiếu kho bị chặn, hủy đơn hoàn lại đúng một lần.
- Món hết nguyên liệu tự chuyển hết hàng và chỉ tự mở lại khi chính hệ thống đã khóa nó trước đó.
- Tạo trang Tồn kho cho admin, panel công thức khi sửa món, cảnh báo ở dashboard và POS.
- Kiểm tra luồng browser desktop/mobile, không cho phép tràn ngang và không có console/network error trong fixture.

## File chính

- `chalo-be/src/modules/inventory/` chứa domain, API và nghiệp vụ transaction tồn kho.
- `chalo-be/src/modules/order/order.service.ts` nối reservation/hoàn tồn vào vòng đời đơn.
- `chalo-fe/src/app/(admin)/admin/inventory/page.tsx` là màn quản trị tồn kho responsive.
- `chalo-fe/src/app/(admin)/admin/menu/products/_components/ProductRecipeEditor.tsx` chỉnh công thức theo món.
- `chalo-fe/e2e/admin-inventory.spec.ts` kiểm admin quản trị kho và cảnh báo bằng Playwright.

## Khác với plan

- File Playwright đặt tên `admin-inventory.spec.ts` thay vì `inventory-management.spec.ts` để nằm cùng nhóm test admin hiện có.
- `deploy/README.md` không cần sửa: migration production đã tự chạy khi backend khởi động, không có bước triển khai riêng.

## Còn dở / cần lưu ý

- Không có.
