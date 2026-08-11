# SSE staff trong Playwright

## Khi nào gặp lại

Playwright mở một màn staff ở môi trường mock và console báo `net::ERR_FAILED` cho `http://localhost:8080/api/order/events`.

## Cách làm đúng

Trong test staff, ghi nhận console errors và chỉ loại trừ chính URL EventSource trên khi assertion. Vẫn fail với mọi console error khác và mọi HTTP response từ 400 trở lên.

## Cái bẫy

Đừng coi lỗi SSE này là lỗi của UI đang sửa hoặc tắt toàn bộ assertion console. EventSource dùng endpoint backend `localhost:8080`, không phải Next mock server; bỏ assertion sẽ che mất lỗi thật của luồng vừa thay đổi.

## Kiểm thế nào là đúng

Chạy `PLAYWRIGHT_BASE_URL=http://127.0.0.1:<port> pnpm exec playwright test e2e/<staff-test>.spec.ts --project=chromium`; test phải pass và lọc chỉ đúng chuỗi `/api/order/events`.
