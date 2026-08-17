# Kiểm middleware (Next 16 "Proxy") bằng Playwright qua `next build` + standalone

## Khi nào gặp lại

Cần test hành vi redirect/guard trong `chalo-fe/middleware.ts` (route bảo vệ theo role,
theo token...) bằng Playwright, và phải dựng server qua `next build` + standalone (xem
[[may-dev-inotify-va-playwright-cwd]] — máy này không chạy được `next dev`).

## Cách làm đúng

1. Set cookie bằng `context.addCookies([{ name, value, url: baseURL }])` trong
   `test.beforeEach`, KHÔNG dùng `page.addInitScript(() => { document.cookie = ... })`.
   Middleware chạy phía server, quyết định xong (kể cả redirect) trước khi bất kỳ script nào
   của trang kịp thực thi — `addInitScript` chỉ có tác dụng từ lần điều hướng thứ 2 trở đi
   trong cùng page, không kịp cho request đầu tiên.
   `baseURL` lấy từ fixture của test (`async ({ context, baseURL }) => ...`), khớp đúng origin
   server đang chạy (vd `http://127.0.0.1:3901`), không hardcode `localhost:3000`.
   Nếu một test phải đổi role, không gọi `context.addInitScript` mỗi lần đổi persona: Playwright
   không đảm bảo thứ tự nhiều init script và script mới không thay đổi document đang mở. Mở một
   document cùng origin **trước** khi cài cookie, rồi cập nhật `chalo-auth` ngay trên document đó
   qua `page.evaluate`; sau đó mới điều hướng đến route của persona mới.
2. Sau khi sửa `middleware.ts`, PHẢI `next build` lại rồi **kill hẳn tiến trình
   `node .next/standalone/server.js` cũ** trước khi start lại — dùng `kill -9 <pid>` lấy từ
   `ss -ltnp | grep <port>`, đừng tin `pkill -f "standalone/server.js"` (pattern có khoảng
   trắng trong path dễ không khớp, exit code không phản ánh đã kill được gì).
3. Repo này chạy Next 16.2.2 — `middleware.ts` đã deprecated, đổi tên chính thức thành
   `proxy.ts` (xem `node_modules/next/dist/docs/.../proxy.md`), nhưng `middleware.ts` VẪN
   được build và chạy dưới nhãn `ƒ Proxy (Middleware)` trong output `next build`. Thấy nhãn
   đó không có nghĩa là code mới của bạn đã chạy.
4. Khi chạy standalone, `server.js` tìm `.next/static` **tương đối với thư mục
   đang chạy**. Sau build, copy asset vào bundle rồi khởi động từ chính thư mục
   standalone:

   ```bash
   cp -R chalo-fe/.next/static chalo-fe/.next/standalone/.next/
   cp -R chalo-fe/public chalo-fe/.next/standalone/public
   cd chalo-fe/.next/standalone
   PORT=3023 HOSTNAME=127.0.0.1 node server.js
   ```

   Thiếu thư mục `public` cũng làm các asset thương hiệu như logo trả `404`,
   dù trang vẫn có thể hydrate. Chạy `node chalo-fe/.next/standalone/server.js` từ root làm HTML vẫn trả
   `200`, nhưng `/_next/static/*` trả `404`; browser chỉ hiện trang trắng hoặc
   hydration không hoàn tất.
5. Trước khi gom route vào cùng một nhánh redirect, đọc các early return phía trên nó.
   `pathname.startsWith(ROUTES.MENU)` hiện là bypass có chủ ý cho **cả** `/menu` và
   `/menu/...`; đừng để exact `/menu` rơi xuống nhánh `PUBLIC_ROUTES`. Với mỗi bypass,
   thêm một test có cookie role lạ để xác nhận URL vẫn không bị redirect.
6. Redirect theo role ở middleware chỉ sống qua lần mở lại trình duyệt khi cookie
   `ACCESS_TOKEN` và `USER_ROLE` có `Max-Age` hoặc `Expires`. Cookie không có hai thuộc tính
   này có expiry `-1` trong Playwright (session-only): Zustand vẫn giữ token ở localStorage,
   nhưng request đầu tiên tới `/` không gửi cookie nên middleware chỉ trả landing page.

## Cái bẫy

Nếu start server mới trong khi cổng cũ (vd 3901) vẫn bị chiếm, lệnh `node server.js` chết vì
`EADDRINUSE` — nhưng nếu chạy nền qua `cmd &`, lỗi này chỉ nằm trong log file, terminal không
báo gì bất thường. Playwright vẫn kết nối được cổng đó (vào server CŨ) và trả kết quả y hệt
trước khi sửa — nhìn như code sửa không có tác dụng, dễ nghi ngờ nhầm sang "middleware.ts bị
Next 16 bỏ qua" (vì đúng là nó deprecated thật) thay vì đi kiểm tiến trình đang chạy là bản nào.

Tương tự, cài cookie role trước khi mở `/login` sẽ khiến middleware redirect ngay sang trang
role mặc định. Trang trung gian đó có thể khởi động query ngoài ý muốn, làm test lifecycle đếm
sai request. Hãy thiết lập origin khi chưa có cookie, rồi mới cài cookie và local auth state.

`PUBLIC_ROUTES` không tự nói lên thứ tự chạy thực tế. Một route có thể vừa nằm trong danh sách
đó vừa bị một early return bắt trước; đưa route đó vào nhánh chung có thể làm test redirect ở
route khác xanh nhưng âm thầm đổi hành vi deep link. So sánh request exact route với base branch,
không chỉ kiểm sub-route hoặc route mới đang sửa.

Đừng chỉ test `localStorage` sau login khi sửa middleware. Lấy cookie từ `context.cookies()`
và assert `expires > Date.now() / 1000`, rồi mở `/` trong browser context mới; đó mới là state
mà middleware nhận được trước khi JavaScript hydrate.

## Kiểm thế nào là đúng

`ss -ltnp | grep <port>` phải ra PID **mới** (khác lần build trước) trước khi chạy
`playwright test`. Nếu nghi ngờ, thêm tạm một `console.log` trong middleware và xem có in ra
log server không trước khi kết luận middleware không chạy.
