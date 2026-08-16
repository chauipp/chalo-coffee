# Cache ảnh upload bất biến

## Khi nào gặp lại

Ảnh món ở POS tải chậm hoặc bị tải/giải mã lại khi rời màn Staff rồi quay về, dù URL ảnh
trong sản phẩm không đổi.

## Cách làm đúng

- Ảnh upload của dự án có tên UUID, không bị ghi đè. Dùng
  `UPLOAD_STATIC_ASSET_OPTIONS` trong `chalo-be/src/config/upload-static-assets.ts` khi serve
  `/uploads`, với `maxAge` một năm và `immutable: true`.
- POS truyền `staleTime: 5 * 60_000` vào `useInfinitePagination`; mutation menu đã invalidate
  `QUERY_KEYS.MENU.PRODUCTS`, nên menu vẫn làm mới sau thao tác quản trị.
- Chỉ hai hàng card đầu viewport dùng `loading="eager"`; card còn lại giữ lazy để không tải cả menu.

## Cái bẫy

`useStaticAssets` không tự suy ra filename UUID là bất biến. Cache mặc định khiến browser revalidate
ảnh mỗi lần card mount lại. Đặt mọi ảnh `eager` thì lại gây cạnh tranh mạng khi menu lớn.

## Kiểm thế nào là đúng

Chạy `pnpm --dir chalo-be test --runInBand upload-static-assets.spec.ts` và
`PLAYWRIGHT_BASE_URL=http://127.0.0.1:<port> pnpm --dir chalo-fe exec playwright test e2e/performance-pos.spec.ts --project=chromium`.
Luồng POS → Đơn hàng → POS phải giữ một request menu và ảnh card đầu có `loading="eager"`.
