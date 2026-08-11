# Landing page công khai Chalo Coffee

**Trạng thái:** Đã được người dùng duyệt ở mức thiết kế.

## Mục tiêu

Khi khách truy cập `chalocoffee.com` (route `/`), họ thấy một landing page công khai, tối giản và dễ sử dụng thay vì bị chuyển thẳng tới màn đăng nhập. Trang phải giúp khách làm ba việc trong vài giây: hiểu đây là Chalo Coffee, xem các món đang bán, và tìm đường tới quán. Đăng nhập vẫn có ở góc phải; đăng ký không xuất hiện trên landing và route đăng ký hiện tại giữ nguyên trạng thái pending.

Phase này không bao gồm checkout, giao hàng, nhập địa chỉ, thanh toán hay tạo đơn online. Các hạng mục đó được để cho phase sau.

## Trải nghiệm và bố cục

### Header

Header trong suốt hoặc nền kem nhẹ, cố định ở đầu khi cuộn trên mobile và desktop. Bên trái là wordmark “CHALO COFFEE”. Bên phải có liên kết neo “Thực đơn”, liên kết “Tìm đường”, và nút “Đăng nhập” trỏ tới `/login`. Không có liên kết `/register`.

### Hero

Hero một màn hình, nền kem ấm theo hướng A (ấm áp, thủ công), typography lớn nhưng ngắn gọn, không có đoạn kể chuyện dài. Nội dung gồm tiêu đề một câu, mô tả một dòng, hai CTA:

- “Xem thực đơn”: cuộn mượt tới section menu.
- “Tìm đường tới quán”: mở `https://maps.app.goo.gl/miDX5WUrMF9vxkia8?g_st=ac` ở tab mới.

Minh hoạ ly cà phê hoặc khối trang trí thuần CSS/ảnh có sẵn có thể nằm cạnh hero trên desktop và xếp phía dưới trên mobile. Không thêm asset nặng hoặc phụ thuộc ảnh từ URL không ổn định.

### Menu động

Section có id `menu` và tiêu đề “Món được yêu thích”. Danh mục hiển thị bằng chip ngang có thể cuộn trên mobile. Dữ liệu dùng lại server services hiện tại:

- Chỉ lấy categories đang `isActive`.
- Chỉ hiển thị products đang `isActive` và có `status === AVAILABLE`.
- Giữ thứ tự `sortOrder` từ Admin.
- Mỗi card có ảnh (nếu có), tên, mô tả tuỳ chọn và giá định dạng VND.
- Nếu ảnh rỗng, render placeholder minh hoạ cùng palette thay vì broken image.
- Nếu backend trả danh sách rỗng hoặc lỗi, landing vẫn render được hero và một trạng thái “Thực đơn đang được cập nhật”, không throw ra trang lỗi.

Phase này không thêm endpoint menu mới và không cho khách đặt món từ card.

### Ghé quán / Footer

Một dải CTA cuối trang nhắc khách ghé quán, có hai nút lặp lại “Tìm đường” và “Nhắn Zalo”. Zalo trỏ tới `https://zalo.me/0913017988`; Maps dùng cùng URL ở hero. Footer giữ nội dung ngắn, gồm tên quán và các liên kết chính.

## Kiến trúc dự kiến

`src/app/page.tsx` trở thành server page, gọi `getMenuCategoriesServer` và `getMenuProductsServer` song song rồi truyền dữ liệu vào các component landing thuần UI. Có thể tách các khối lớn thành các component trong `src/app/_components/` (header, hero, menu section, visit CTA) để mỗi khối có trách nhiệm rõ ràng. Không thay đổi auth store, middleware, customer menu theo QR, admin hoặc staff.

Cache server dùng cơ chế hiện tại với thời gian revalidate khoảng một giờ và tag menu hiện có. Các nút ngoài site dùng `target="_blank"` kèm `rel="noreferrer"`; liên kết neo dùng `scroll-behavior: smooth` và vẫn hoạt động khi JS bị tắt ở mức cơ bản.

## Responsive, accessibility và SEO

- Mobile-first: không overflow ngang; chip menu có vùng bấm đủ lớn; CTA xếp dọc khi cần.
- Màu chữ/nền đạt tương phản tốt; ảnh có alt; các nút có tên rõ ràng; focus ring không bị loại bỏ.
- Cập nhật metadata trang chủ với title “Chalo Coffee” và mô tả phù hợp; giữ `lang="vi"`.
- Không dùng carousel tự chạy, popup hoặc animation ảnh hưởng thao tác.

## Kiểm thử và tiêu chí chấp nhận

1. Mở `/` không redirect sang `/login`; `/login` vẫn mở đúng form.
2. Desktop và viewport mobile đều hiển thị header, hero, hai CTA, menu và footer không overflow.
3. “Xem thực đơn” cuộn đến `#menu`; “Tìm đường” mở đúng Maps; “Nhắn Zalo” mở đúng số Zalo; “Đăng nhập” đi tới `/login`.
4. Với fixture menu, chỉ món active/available xuất hiện và giá hiển thị đúng định dạng; trạng thái rỗng không làm crash.
5. Chạy unit/type/build hiện có và Playwright Chromium cho desktop + mobile; chỉ báo hoàn tất sau khi kiểm tra trực quan.

## Ngoài phạm vi

Đặt giao hàng, giỏ hàng, tài khoản khách, thanh toán chuyển khoản, xác nhận đơn thủ công, phí ship, tích hợp SePay và màn quản trị nội dung landing không thuộc phase này.

## Tài liệu liên quan

Plan thực thi sẽ được liên kết tại đây ngay sau khi được viết: `../plans/2026-08-11-public-landing-page.md`.
