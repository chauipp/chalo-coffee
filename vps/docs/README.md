# Vận hành VPS Chalo Coffee

Tài liệu thao tác cho VPS Vietnix của Chalo Coffee. Không lưu mật khẩu VPS,
database password, JWT secret hoặc Google Client Secret vào file này.

## Thông tin hệ thống

- Domain: `https://chalocoffee.com`
- VPS: Vietnix, Ubuntu/Linux
- Kiến trúc: Docker Compose gồm `caddy`, `frontend`, `backend`, `postgres`.
- Caddy nhận HTTPS và chuyển `/api/*` vào NestJS; các path còn lại vào Next.js.
- File cấu hình thật: `.env` ở **root repository trên VPS**, cùng cấp với
  `docker-compose.prod.yml`. File này không được commit Git.

## 1. Đăng nhập SSH

Trên macOS/Linux, mở Terminal. Trên Windows, mở PowerShell hoặc Windows Terminal:

```bash
ssh root@221.132.21.65
```

Nhập mật khẩu VPS khi được hỏi. Không dán hoặc gửi mật khẩu vào chat, Git hay ảnh chụp màn hình.

Sau khi vào VPS, xác định thư mục code đang chạy:

```bash
find / -name docker-compose.prod.yml -type f 2>/dev/null
```

Ví dụ lệnh trả về `/opt/chalo-coffee/docker-compose.prod.yml` thì các lệnh tiếp theo dùng:

```bash
cd /opt/chalo-coffee
pwd
git status --short --branch
```

> Từ đây, thay `/opt/chalo-coffee` bằng đường dẫn thực tế tìm được. Không chạy
> các lệnh Docker/deploy ở một thư mục khác.

Thoát SSH bằng:

```bash
exit
```

## 2. Kiểm tra nhanh tình trạng ứng dụng

Trong thư mục dự án trên VPS:

```bash
docker compose -f docker-compose.prod.yml ps
curl -fsS https://chalocoffee.com/api/health
df -h
free -h
```

Kỳ vọng các service `postgres`, `backend`, `frontend`, `caddy` có trạng thái
`running`/`Up`, endpoint health trả về thành công, và ổ đĩa/RAM không gần đầy.

Xem log gần nhất:

```bash
docker compose -f docker-compose.prod.yml logs --tail=150 backend
docker compose -f docker-compose.prod.yml logs --tail=150 frontend
docker compose -f docker-compose.prod.yml logs --tail=150 caddy
```

Theo dõi log liên tục (dừng bằng `Ctrl+C`):

```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

## 3. Chỉnh biến môi trường `.env`

Kiểm tra file tồn tại và chỉnh sửa:

```bash
cd /opt/chalo-coffee
ls -la .env
nano .env
```

Trong `nano`:

- Lưu: `Ctrl+O` → Enter
- Thoát: `Ctrl+X`
- Không in nội dung `.env` ra terminal, vì chứa secret.

Sau khi sửa secret hoặc biến backend, restart stack:

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

`--build` là bắt buộc khi đổi biến `NEXT_PUBLIC_*`, `PUBLIC_URL`, hoặc khi vừa
cập nhật code frontend. Frontend nhúng các biến công khai khi build.

Phân biệt:

- `deploy/.env.example` trong Git: chỉ là mẫu, an toàn để xem.
- `.env` trên VPS: cấu hình thật, chứa secret, không commit.

## 4. Cập nhật phiên bản từ GitHub

Trước mỗi deploy, backup database (mục 5). Sau đó:

```bash
cd /opt/chalo-coffee
git fetch origin
git status --short --branch
git pull --ff-only origin main
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=200 backend frontend caddy
curl -fsS https://chalocoffee.com/api/health
```

Nếu `git pull --ff-only` báo lỗi vì VPS có thay đổi local, **dừng lại** và kiểm tra:

```bash
git status
git diff
```

Không dùng `git reset --hard`, `git clean -fd`, hoặc xoá file khi chưa biết rõ
thay đổi đó là gì.

Migrations backend chạy khi backend khởi động production. Sau deploy có migration,
log backend cần không có lỗi migration/database.

## 5. Backup và khôi phục database

### Backup trước deploy hoặc trước thao tác rủi ro

```bash
cd /opt/chalo-coffee
set -a
. ./.env
set +a
mkdir -p backups
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U "$DB_USERNAME" "$DB_DATABASE" > "backups/chalo_$(date +%F_%H%M%S).sql"
ls -lh backups
```

Tải file backup về máy cá nhân/ổ lưu trữ khác định kỳ. Backup chỉ ở VPS không
chống được mất VPS.

### Khôi phục

Khôi phục sẽ ghi dữ liệu vào database hiện có. Chỉ làm khi đã có backup mới và
biết chính xác file cần dùng:

```bash
cd /opt/chalo-coffee
set -a
. ./.env
set +a
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U "$DB_USERNAME" -d "$DB_DATABASE" < backups/ten_file_can_khoi_phuc.sql
```

Sau khôi phục, kiểm tra `docker compose ... ps`, health endpoint và đăng nhập
admin/staff trước khi cho quán sử dụng.

## 6. Google đăng nhập cho khách

Google OAuth chỉ áp dụng cho khách (`CUSTOMER`). Staff/admin vẫn dùng tài khoản
hiện có; admin có thể nâng role một account Google sau này từ màn quản lý nhân sự.

### Cấu hình Google Cloud Console

Tạo OAuth Client loại **Web application** trong Google Cloud project của Chalo Coffee:

- User type: **External**.
- Authorized JavaScript origin: `https://chalocoffee.com`
- Authorized redirect URI: `https://chalocoffee.com/api/auth/google/callback`
- Scope: `openid`, `email`, `profile`.

Khi app còn Testing, phải thêm Gmail dùng thử vào Test users. Trước khi mở cho
khách thật, chuyển consent screen sang Production.

### Khai báo trên VPS

Sau khi tạo client, chỉnh `.env`:

```dotenv
GOOGLE_OAUTH_ENABLED=true
GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<client-secret>
GOOGLE_CALLBACK_URL=https://chalocoffee.com/api/auth/google/callback
```

Giới hạn quyền đọc file rồi build/restart:

```bash
cd /opt/chalo-coffee
chmod 600 .env
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs --tail=200 backend frontend
```

Kiểm tra:

```bash
curl -I 'https://chalocoffee.com/api/auth/google/start?returnTo=/account'
```

Sau đó mở `/login` trên điện thoại, bấm **Tiếp tục với Google**, đăng nhập một
Gmail test và kiểm tra được chuyển về `/account`.

Nếu Client Secret lộ, vào Google Cloud Console để reset/rotate secret, cập nhật
`.env`, rồi chạy lại `docker compose -f docker-compose.prod.yml up -d --build`.
Không gửi secret qua chat hoặc commit Git.

Tài liệu chi tiết liên quan code: `deploy/google-oauth.md`.

## 7. Rollback code an toàn

Xem các commit gần đây:

```bash
cd /opt/chalo-coffee
git log --oneline -10
```

Để quay về một commit đã biết tốt, ưu tiên tạo nhánh backup trước:

```bash
git branch backup-before-rollback-$(date +%F-%H%M)
git checkout <commit-tot>
docker compose -f docker-compose.prod.yml up -d --build
```

Việc này đặt repo ở detached HEAD; sau khi ổn định cần ghi lại commit đang chạy.
Không rollback migration/database chỉ vì rollback code, trừ khi đã đọc migration
và xác nhận an toàn. Luôn backup database trước.

## 8. Sự cố thường gặp

| Hiện tượng | Kiểm tra/khắc phục |
|---|---|
| Website không vào được | `docker compose ... ps`, log `caddy`, DNS domain, firewall cổng 80/443. |
| API lỗi 502/500 | Log `backend`, trạng thái `postgres`, biến DB/JWT trong `.env`. |
| HTTPS không có | DNS phải trỏ đúng IP VPS và cổng 80/443 không bị chặn; xem log Caddy. |
| Google login không thấy nút | `GOOGLE_OAUTH_ENABLED=true`, rồi đã chạy `up -d --build` để build frontend. |
| Google báo redirect URI mismatch | So khớp từng ký tự URI Console với `GOOGLE_CALLBACK_URL`. |
| Backend restart liên tục | `docker compose ... logs --tail=200 backend`; thường do `.env` thiếu/sai DB hoặc JWT. |
| Build bị `Killed`/OOM | `free -h`; giải phóng RAM hoặc thêm swap trước khi build lại. |
| Ổ đĩa gần đầy | `df -h`, `docker system df`; không chạy prune/xoá volumes khi chưa xem kỹ dữ liệu. |

## 9. Các lệnh không nên chạy tùy tiện

Không chạy trên VPS production nếu chưa chắc phạm vi:

```bash
docker compose down -v
docker system prune -a --volumes
rm -rf ...
git reset --hard
git clean -fd
```

Các lệnh trên có thể xoá database, uploads, certificate, image cần rollback,
hoặc thay đổi local quan trọng. Hãy backup và kiểm tra trước.
