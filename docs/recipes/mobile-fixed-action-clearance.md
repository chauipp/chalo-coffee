# Nội dung dưới thanh cố định trên mobile

## Khi nào gặp lại

PWA/mobile có nav hoặc CTA `fixed` ở đáy; ở cuối trang, nút hoặc input bị nó che dù
`main` đã có `padding-bottom`.

## Cách làm đúng

1. Cho shell có chiều cao xác định (`h-dvh`) và chỉ `main` được `overflow-auto`.
2. Dùng `--mobile-bottom-nav-clearance` trong `src/app/globals.css` làm một mốc chung.
3. Gắn `mobile-scroll-clearance` vào vùng cuộn Admin/Staff; pseudo-element `::after`
   tạo spacer thực sau nội dung.
4. Drawer/POS dùng `bottom: var(--mobile-bottom-nav-clearance)`; CTA khách tính thêm
   `env(safe-area-inset-bottom)` và tăng khoảng cuộn của nội dung.

## Cái bẫy

Đặt `padding-bottom` lên chính scroll container có thể không tạo thêm hành trình cuộn:
padding bị tính trong chiều cao client của container. Với form ngắn, CTA vẫn nằm dưới nav
mà không có lỗi console hay test unit báo đỏ. Dùng spacer ở sau child mới tăng `scrollHeight`.

## Kiểm thế nào là đúng

Ở 390×844, cuộn Admin Settings đến cuối và đo: input cuối ≤ thanh Lưu ≤ nav. Header shell
vẫn phải thấy được; kiểm console/network sạch. Case này có trong
`chalo-fe/e2e/admin-mobile.spec.ts`.
