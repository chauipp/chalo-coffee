# PWA static cache và notice cài đặt

## Khi nào gặp lại

Khi sửa PWA toàn cục của Chalo Coffee: service worker chỉ cache tài nguyên tĩnh và notice cài đặt xuất hiện trên mọi route mobile.

## Cách làm đúng

- Chỉ đăng ký service worker trong production; chỉ intercept `GET` cùng origin cho các đường dẫn static đã cho phép.
- Test cache hit của worker bằng VM: cho cache hiện hành trả `Response`, làm `fetch` throw, rồi khẳng định response cache được trả và số lần fetch là 0.
- Đặt notice theo đáy lớn nhất của các thẻ `header` đang hiển thị (quan sát resize, mutation, xoay màn hình), không dùng offset route cố định.
- Kiểm bằng production standalone Playwright trên ít nhất landing/customer/staff mobile.

## Cái bẫy

`page.route()` không quan sát đáng tin request do service worker xử lý, nên số request bằng 0 không chứng minh cache hit. Offset CSS cố định cũng chỉ đúng ở một header; customer menu và các layout khác cao hơn sẽ bị notice che.

## Kiểm thế nào là đúng

Chạy `pnpm --dir chalo-fe test:unit`, `pnpm --dir chalo-fe exec tsc --noEmit --pretty false`, build production và `playwright test e2e/pwa-install.spec.ts`. Trong browser, đo notice nằm sau header cao nhất và xác nhận API vẫn đi qua mạng.
