# `next build` (Turbopack) panic khi `node_modules` là symlink ra ngoài worktree

## Khi nào gặp lại

Chạy `pnpm build` / `next build` trong `chalo-fe` bên trong một worktree mà `node_modules`
được symlink trỏ ra checkout gốc (cách tiết kiệm dung lượng/thời gian phổ biến khi dựng
worktree), và gặp lỗi:

```
FATAL: An unexpected Turbopack error occurred
Symlink [project]/node_modules is invalid, it points out of the filesystem root
```

## Cách làm đúng

FE build bằng Turbopack cần `node_modules` là thư mục thật trong chính worktree đó — không
symlink được. Xoá symlink rồi cài thật:

```bash
rm chalo-fe/node_modules
cd chalo-fe && CI=true pnpm install --frozen-lockfile
```

`CI=true` để né prompt "Aborted removal of modules directory due to no TTY" khi pnpm chạy
không có TTY tương tác (agent/CI).

## Cái bẫy

BE (`chalo-be`) chạy test bằng Jest, không phải Turbopack — symlink `node_modules` cho BE vẫn
hoạt động bình thường. Dễ áp dụng đồng loạt "symlink cho cả hai" rồi bất ngờ khi chỉ FE build
lỗi; nguyên nhân là Turbopack tự resolve path thật của symlink và coi nó nằm ngoài project
root nó đang track, không liên quan gì đến nội dung code hay cấu hình `next.config.ts`.

## Kiểm thế nào là đúng

`ls -la chalo-fe/node_modules` phải ra một thư mục thật (không có `->`), rồi `next build`
chạy hết "Creating an optimized production build" mà không panic.
