# Kết quả landing page công khai Chalo Coffee

Liên quan: [spec thiết kế](../specs/2026-08-11-public-landing-page-design.md) · [plan triển khai](../plans/2026-08-11-public-landing-page.md)

## Đã làm gì

- Route `/` nay hiển thị landing page công khai tối giản thay vì redirect sang đăng nhập; đăng nhập vẫn có ở header và không còn link đăng ký trên landing.
- Thêm hero tông cà phê ấm, CTA cuộn tới thực đơn, Google Maps và Zalo đúng thông tin quán.
- Thực đơn landing lấy category/product từ Admin, lọc chỉ món active/available, sắp theo `sortOrder`, có chip danh mục, định dạng giá VND và placeholder ảnh.
- Thêm empty state an toàn khi menu API không phản hồi hoặc chưa có món; thêm metadata, favicon Chalo, smooth scroll tôn trọng reduced-motion và focus state.
- Đã kiểm Chromium desktop/mobile, unit adapter, TypeScript, production build và Playwright regression cho route/CTA/mobile overflow.

## File chính

- `chalo-fe/src/app/page.tsx` fetch menu server-side và render landing thay redirect login.
- `chalo-fe/src/app/_components/PublicLanding.tsx` chứa UI public header, hero, menu lọc theo chip, CTA Maps/Zalo và footer.
- `chalo-fe/src/app/_components/landing-data.ts` nhóm/lọc dữ liệu menu an toàn, dùng chung cho server page.
- `chalo-fe/e2e/public-landing.spec.ts` kiểm đường đi khách hàng trên landing bằng Playwright.
- `chalo-fe/src/app/layout.tsx`, `globals.css`, `icon.svg` bổ sung metadata, smooth scrolling và favicon.

## Khác với plan

- Thêm `src/app/icon.svg` sau khi kiểm browser để tránh request favicon 404; đây là bổ sung nhỏ ngoài file map ban đầu.
- Full `pnpm lint` không thể xanh do 12 lỗi có sẵn ở các màn admin/staff/shared không thuộc phase. ESLint cho các file landing mới không có error (còn 1 warning `<img>` của Next.js, nhất quán với các product card hiện có).
- Backend local tại `localhost:8080` không khả dụng khi kiểm browser, nên UI được xác nhận ở empty state thực tế; hành vi lọc menu động được kiểm riêng bằng fixture unit test.

## Còn dở / cần lưu ý

- Checkout, giao hàng, thanh toán, giỏ hàng và tạo đơn online vẫn chưa được làm, đúng phạm vi phase này.
- Trước khi đưa production, nên kiểm lại landing với backend đang chạy và menu thật để xác nhận ảnh/nội dung sản phẩm từ Admin.
