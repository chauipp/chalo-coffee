# PWA static cache và notice cài đặt

## Khi nào gặp lại

Khi sửa PWA toàn cục của Chalo Coffee: service worker chỉ cache tài nguyên tĩnh, notice cài đặt xuất hiện trên mọi route mobile, hoặc PWA đã đăng nhập mở lại landing rồi refresh mới về đúng màn role.

## Cách làm đúng

- Chỉ đăng ký service worker trong production; chỉ intercept `GET` cùng origin cho các đường dẫn static đã cho phép.
- Test cache hit của worker bằng VM: cho cache hiện hành trả `Response`, làm `fetch` throw, rồi khẳng định response cache được trả và số lần fetch là 0.
- Đặt notice theo đáy lớn nhất của các thẻ `header` đang hiển thị (quan sát resize, mutation, xoay màn hình), không dùng offset route cố định.
- `manifest.start_url` phải là đường khởi động riêng (`/pwa-launch`), middleware trả redirect theo role kèm `Cache-Control: no-store`; tăng version cache trong `public/sw.js` khi phát hành thay đổi khởi động.
- Landing client phải tự chuyển role chỉ trong standalone sau khi auth đã hydrate, kể cả sự kiện `pageshow`; giữ `?landing=1` là lối vào chủ đích để logo vẫn mở landing.
- Kiểm bằng production standalone Playwright trên ít nhất landing/customer/staff mobile.

## Cái bẫy

`page.route()` không quan sát đáng tin request do service worker xử lý, nên số request bằng 0 không chứng minh cache hit. Offset CSS cố định cũng chỉ đúng ở một header; customer menu và các layout khác cao hơn sẽ bị notice che. Quan trọng hơn, worker chỉ cache static không chứng minh PWA đã tạo navigation mới: standalone có thể khôi phục document landing cũ, nên middleware không chạy dù cookie vẫn hợp lệ; vì thế refresh mới tự sửa triệu chứng.

## Kiểm thế nào là đúng

Chạy `pnpm --dir chalo-fe test:unit`, build production và `PLAYWRIGHT_BASE_URL=<production-url> pnpm --dir chalo-fe exec playwright test e2e/auth-persistence.spec.ts e2e/home-role-redirect.spec.ts e2e/pwa-install.spec.ts --project=chromium --workers=1`. Trong browser, mô phỏng root trả landing khi cookie bị loại khỏi request đầu tiên nhưng auth local vẫn có: PWA phải tự tới dashboard/POS, console/network sạch, rồi logo phải mở `/?landing=1`.
