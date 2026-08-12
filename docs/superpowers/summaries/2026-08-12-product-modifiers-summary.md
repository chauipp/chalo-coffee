# Kết quả: Tùy chọn món động

Thiết kế: `../specs/2026-08-12-product-modifiers-design.md`  
Kế hoạch: `../plans/2026-08-12-product-modifiers.md`

## Đã làm gì

- Admin có thể tạo và chỉnh sửa nhóm tùy chọn riêng cho từng món, gồm kiểu chọn một/nhiều, bắt buộc và phụ thu; lựa chọn mới mặc định `0đ`.
- Hệ thống lưu cấu hình option trong database và tự tính giá ở backend; request có lựa chọn sai, trùng, hoặc thiếu lựa chọn bắt buộc bị từ chối.
- Khách và staff POS chọn tùy chọn trước khi thêm vào giỏ; các biến thể khác nhau nằm ở các dòng giỏ riêng và giá cập nhật theo lựa chọn.
- Snapshot lựa chọn được giữ trong order item, hiện lại trên đơn khách/staff, receipt và nhóm pha chế để không sai ly sau khi menu đổi.
- Giỏ hàng cũ được migrate an toàn sang cấu trúc mới; frontend build được sửa lỗi type wrapper API có sẵn.

## File chính

- `chalo-be/src/migrations/1784365811594-ProductModifiers.ts`: thêm bảng modifier và snapshot JSONB cho order item.
- `chalo-be/src/modules/product/product.service.ts`: trả/lưu cấu hình option theo sản phẩm.
- `chalo-be/src/modules/order/order.service.ts`: kiểm server-side và chụp giá/tên option vào đơn.
- `chalo-fe/src/components/menu/ProductModifierFields.tsx`: editor tùy chọn động trong form admin.
- `chalo-fe/src/components/menu/ProductModifierPicker.tsx`: picker dùng chung cho khách và POS.
- `chalo-fe/src/stores/cart.store.ts`: identity giỏ theo tổ hợp option và migration từ cart cũ.

## Khác với plan

- Sửa thêm type wrapper trong `chalo-fe/src/lib/api-client.ts` vì lỗi tồn tại trước đó làm Next build dừng, dù feature không gây ra lỗi này.
- Playwright không chạy được: dev server không thể watch do giới hạn file watcher toàn máy (`EMFILE: too many open files`), cả Turbopack và Webpack đều tái hiện. Không có UI browser verification trong môi trường hiện tại.

## Còn dở / cần lưu ý

- Backend: `104/104` tests và production build pass. Frontend: `20/20` unit tests và production build pass.
- Trước khi đưa vào production, cần chạy lại e2e UI khi môi trường không bị `EMFILE`; test đã có tại `chalo-fe/e2e/admin-product-modifiers.spec.ts`.
