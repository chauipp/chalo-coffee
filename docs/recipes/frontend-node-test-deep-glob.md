# Chạy đủ unit test frontend nằm sâu trong `src`

## Khi nào gặp lại

Thêm file `*.test.mts` dưới thư mục sâu như `src/services/auth/`, nhưng `pnpm test:unit` vẫn xanh mà không liệt kê test mới.

## Cách làm đúng

Dùng `find` để truyền danh sách file thực tế cho Node test runner:

```bash
node --test --experimental-strip-types $(find src -name '*.test.mts' -print)
```

Sau khi thêm test, kiểm tổng số test trong output tăng đúng như mong đợi.

## Cái bẫy

Script cũ dùng `src/**/*.test.mts`. Bash chạy qua `pnpm` không bật `globstar`, nên pattern này chỉ khớp test sâu đúng một cấp và âm thầm bỏ qua test trong `src/app/...` hoặc `src/services/...`. Lệnh vẫn exit 0 nên tạo trạng thái “xanh giả”.

## Kiểm thế nào là đúng

Chạy `pnpm test:unit`; output phải liệt kê cả test trong `src/services/auth/google-oauth.test.mts` và hiện tổng số test hiện tại là 15 hoặc cao hơn.
