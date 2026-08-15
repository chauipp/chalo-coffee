# Shell sidebar pha chế toàn cục cho admin

## Khi nào gặp lại

Khi cần đưa khu pha chế vào mọi route `/admin/*` mà vẫn giữ PrepDock thường trực ở staff.

## Cách làm đúng

- Sở hữu state mở/đóng ở `AdminPrepSidebarLayout`, cạnh `AdminLayout`.
- Dùng `admin-prep-visible:v1` cho visibility và `admin-prep-split:v1` cho tỷ lệ; không đụng `staff-prep-split`.
- Khi đóng, giữ children trong pane trái và chỉ thêm rail desktop tối thiểu 40px; khi mở, dùng `SplitPane` thật với `PrepDock` ở pane phải.
- Truyền `onToggleVisible` tùy chọn xuống `PrepDock`/`PrepStation`, để staff không xuất hiện nút thu gọn.

## Cái bẫy

Không render children lần hai cho mobile chỉ để ẩn rail/dock: việc đó nhân đôi cây React và state route. Render children một lần; ẩn rail bằng `md:flex` và để pane phải của `SplitPane` tự ẩn ở mobile theo pattern staff.

## Kiểm thế nào là đúng

Chạy test state và typecheck:

`node --test --experimental-strip-types src/app/(admin)/_components/adminPrepSidebarState.test.mts && npx tsc --noEmit --pretty false`
