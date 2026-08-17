# PWA cài đặt Chalo Coffee — thiết kế

## Mục tiêu

Biến web Chalo Coffee thành PWA mức 1: người dùng cài từ Home Screen, mở ứng dụng ở chế độ độc lập gần như app native, có icon/thương hiệu đúng và tải lại nhanh nhờ cache tài nguyên tĩnh. Ứng dụng vẫn là web Next.js; không phát hành qua App Store hoặc Google Play.

## Phạm vi

- Cung cấp Web App Manifest cho toàn bộ site, với `display: "standalone"`, `start_url: "/"`, màu thương hiệu sáng/tối và icon PNG kích thước phù hợp.
- Bổ sung metadata iOS (`appleWebApp`) cùng viewport `viewportFit: "cover"`, để app cài từ Home Screen mở không có chrome trình duyệt và tôn trọng safe area.
- Đăng ký service worker tự viết, không thêm dependency PWA, chỉ cache app shell/tài nguyên tĩnh cùng origin (bao gồm logo/icon và `/_next/static/*`).
- Luôn dùng network cho API (`/api/*`, backend API), SSE, trang HTML/RSC và thao tác đơn hàng; không ghi cache response API hoặc dữ liệu runtime.
- Hiển thị một lời nhắc cài đặt nhỏ, không chặn thao tác, chỉ ở mobile khi browser phát `beforeinstallprompt`; nếu không hỗ trợ (nhất là iOS), hiển thị hướng dẫn “Thêm vào Màn hình chính” thay vì cố gọi Fullscreen API.
- Người đã cài app không nhìn thấy lời nhắc; người đóng lời nhắc chỉ bị nhắc lại trong phiên sau, không dùng popup ép buộc.

## Ngoài phạm vi

- Không hỗ trợ tạo/sửa đơn, POS, pha chế hay dữ liệu realtime khi offline.
- Không cache JSON/API, không làm background sync, không thêm push notification.
- Không thay đổi endpoint, phân quyền, navigation, layout desktop/mobile hoặc hành vi đăng nhập.
- Không dùng Fullscreen API như nút F11: browser mobile không cho website ép full-screen đáng tin cậy, đặc biệt trên iOS.

## Kiến trúc

`app/manifest.ts` cung cấp manifest type-safe của Next, tham chiếu các icon trong `public/brand`. Root layout khai báo metadata PWA/iOS và mount một client component `PwaInstallPrompt` để đăng ký `/sw.js`, nghe sự kiện cài đặt trên Chromium và phân biệt display mode installed/standalone.

`public/sw.js` là service worker độc lập, versioned cache name. Ở `install`, nó chỉ pre-cache manifest/icon/logo; ở `fetch`, chỉ xử lý `GET` cùng origin cho static assets theo chiến lược cache-first. Mọi request còn lại được để nguyên qua network. Khi service worker mới activate, nó xóa cache cũ mang prefix riêng của Chalo để lần deploy mới không giữ static asset lỗi thời.

## Trải nghiệm người dùng

- Android Chrome/Edge: một card/bottom notice “Cài ứng dụng” có nút Cài; bấm gọi prompt hệ điều hành, kết quả chấp nhận/từ chối được phản ánh bằng ẩn notice.
- iPhone/iPad Safari: notice ngắn hướng dẫn dùng Share → “Thêm vào Màn hình chính”. Không quảng cáo là nút cài trực tiếp.
- App cài xong: mở ở `standalone`, không render notice; safe area ở header/bottom nav vẫn do CSS hiện có xử lý.
- Offline: static shell/icon có thể hiện từ cache, nhưng các request dữ liệu vẫn lỗi theo cơ chế hiện tại; không hiển thị số đơn/dữ liệu cũ như thể là realtime.

## Kiểm chứng

- Unit test kiểm manifest có display/start_url/icons đúng và helper detect display mode/eligibility không nhắc khi installed.
- Playwright production standalone desktop/mobile kiểm service worker registration, không có console/HTTP 4xx/5xx ngoài fixture, Android-style prompt mô phỏng được mở/đóng và không che navigation.
- Intercept test xác nhận request `/api/*` không bị service worker trả từ cache; asset static được phục vụ cache-first qua Service Worker API test hoặc browser context độc lập.
- `pnpm --dir chalo-fe test:unit`, TypeScript, production build và `git diff --check main...HEAD` phải xanh.

## Rủi ro và cách giảm thiểu

- Service worker cũ có thể giữ asset cũ: version cache và xóa cache prefix ở activate.
- `beforeinstallprompt` không có trên Safari: dùng hướng dẫn iOS, không coi đó là lỗi.
- Cache API có thể làm nhầm realtime: phạm vi fetch handler giới hạn static GET cùng origin; API/HTML/RSC/SSE bỏ qua hoàn toàn.

## Plan thực thi

[Kế hoạch triển khai](../plans/2026-08-17-pwa-install.md).
