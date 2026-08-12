# Sổ tay vận hành VPS — Chalo Coffee

Tài liệu dành cho người vận hành hệ thống Chalo Coffee trên VPS Vietnix.
Mục tiêu là có thể tự kiểm tra, deploy, backup và khôi phục an toàn mà không
cần nhớ lệnh. Đọc phần **Lệnh nguy hiểm** trước khi thao tác production.

> Không ghi mật khẩu VPS, Google Client Secret, JWT secret, mật khẩu database,
> SSH private key hay file `.env` thật vào Git, chat, screenshot hoặc ticket.

## Mục lục

1. [Bản đồ hệ thống](#1-bản-đồ-hệ-thống)
2. [Đăng nhập VPS](#2-đăng-nhập-vps)
3. [Auto-deploy từ GitHub](#3-auto-deploy-từ-github)
4. [Kiểm tra sức khỏe và log](#4-kiểm-tra-sức-khỏe-và-log)
5. [Biến môi trường `.env`](#5-biến-môi-trường-env)
6. [Deploy tay và migration](#6-deploy-tay-và-migration)
7. [Backup và khôi phục database](#7-backup-và-khôi-phục-database)
8. [Google đăng nhập](#8-google-đăng-nhập)
9. [Domain, HTTPS và DNS](#9-domain-https-và-dns)
10. [Rollback, restart và bảo trì](#10-rollback-restart-và-bảo-trì)
11. [Sự cố thường gặp](#11-sự-cố-thường-gặp)
12. [Bảo mật và lệnh nguy hiểm](#12-bảo-mật-và-lệnh-nguy-hiểm)

---

## 1. Bản đồ hệ thống

| Hạng mục | Giá trị hiện tại |
|---|---|
| Domain chính | `https://chalocoffee.com` |
| IP VPS | `221.132.21.65` |
| Nhà cung cấp | Vietnix VPS Linux |
| User SSH | `root` |
| Thư mục dự án trên VPS | `/root/chalo-coffee` |
| Nhánh production | `main` trên `origin` |
| File stack production | `docker-compose.prod.yml` |
| File cấu hình bí mật | `/root/chalo-coffee/.env` |
| Proxy/SSL | Caddy + Let's Encrypt |
| Database | PostgreSQL trong Docker volume |

Luồng truy cập:

```text
Khách / nhân viên
       │ HTTPS :443
       ▼
Caddy (SSL tự gia hạn)
  ├─ /api/*      → backend NestJS :8080
  ├─ /uploads/*  → backend NestJS :8080
  └─ /*          → frontend Next.js :3000
                         │
                         ▼
                  PostgreSQL :5432 (chỉ trong Docker)
```

Các container production:

| Service | Vai trò | Có mở ra Internet? |
|---|---|---|
| `caddy` | HTTPS, proxy, certificate | Có: 80/443 |
| `frontend` | Website Next.js | Không, chỉ qua Caddy |
| `backend` | API NestJS | Không, chỉ qua Caddy |
| `postgres` | Database | Không, chỉ mạng Docker nội bộ |

Dữ liệu tồn tại qua rebuild/restart nhờ Docker volumes: `postgres_data`,
`uploads_data`, `caddy_data`, `caddy_config`.

---

## 2. Đăng nhập VPS

### 2.1 SSH từ máy cá nhân

Trên macOS/Linux dùng Terminal; Windows dùng PowerShell hoặc Windows Terminal:

```bash
ssh root@221.132.21.65
```

Sau khi thấy prompt dạng dưới đây là đã vào VPS:

```text
root@chalo-coffee-umnq:~#
```

Đi vào dự án:

```bash
cd /root/chalo-coffee
pwd
git status --short --branch
```

Kỳ vọng `pwd` trả `/root/chalo-coffee`.

Nếu không nhớ thư mục dự án:

```bash
find / -name docker-compose.prod.yml -type f 2>/dev/null
```

Thoát SSH:

```bash
exit
```

### 2.2 Nếu không SSH được

Kiểm tra lần lượt:

```bash
ping 221.132.21.65
ssh -v root@221.132.21.65
```

- `Connection timed out`: kiểm firewall/Vietnix và cổng 22.
- `Permission denied`: sai password/key; reset qua portal Vietnix hoặc liên hệ hỗ trợ.
- Có SSH nhưng không vào được Docker: dùng `root` hiện tại hoặc kiểm `docker ps`.

Không cần biết lại password nếu đang có một phiên SSH đang mở. Đừng dùng
**Reinstallation** trên portal Vietnix để “reset password” trừ khi đã backup
và hiểu rõ: thao tác này có thể cài lại OS, làm mất toàn bộ VPS.

---

## 3. Auto-deploy từ GitHub

### 3.1 Luồng tự động hiện tại

Mỗi lần push lên `main`, GitHub Actions workflow
[`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) tự SSH vào VPS và chạy:

```bash
cd ~/chalo-coffee
git fetch --all
git reset --hard origin/main
docker compose -f docker-compose.prod.yml up -d --build
docker image prune -f
```

Vì vậy thông thường: **merge/push vào `main` là tự deploy**, không phải SSH chạy
lệnh tay. Workflow build lại cả backend và frontend; migration production được
backend chạy khi khởi động.

### 3.2 Kiểm tra auto-deploy đã xong

1. Vào GitHub repository → tab **Actions** → workflow **Deploy to production**.
2. Chọn run mới nhất của commit vừa push.
3. Chỉ khi có dấu xanh `Success` mới coi là deploy hoàn tất.
4. Kiểm tra website/API:

```bash
curl -fsS https://chalocoffee.com/api/health
```

### 3.3 Khi nào vẫn phải SSH chạy tay?

| Tình huống | Có cần chạy tay? | Vì sao |
|---|---:|---|
| Chỉ push code lên `main`, Actions xanh | Không | Workflow đã deploy. |
| Vừa sửa `.env` trên VPS | Có | `.env` không nằm trong Git; phải recreate container. |
| Actions thất bại / không chạy | Có | Cần xem lỗi rồi deploy tay nếu đã rõ nguyên nhân. |
| Cần restart container | Có | Không có commit mới để kích Actions. |
| Cần rollback khẩn cấp | Có | Là thao tác vận hành có chủ đích. |

### 3.4 GitHub Secrets cần có để auto-deploy

Repository → Settings → Secrets and variables → Actions:

| Secret | Ý nghĩa |
|---|---|
| `VPS_HOST` | IP hoặc hostname VPS, hiện là `221.132.21.65` |
| `VPS_USER` | User SSH, hiện là `root` |
| `VPS_SSH_KEY` | Private key deploy; có thể raw PEM/OpenSSH hoặc base64 theo workflow |

Không đưa các secret này vào `.env.example` hoặc commit.

> Workflow dùng `git reset --hard origin/main` trên **VPS**. Vì thế không sửa
> source code trực tiếp trong `/root/chalo-coffee`: lần deploy kế tiếp sẽ xoá
> thay đổi đó. Chỉ `.env`, backup và dữ liệu vận hành được phép tồn tại riêng
> trên VPS.

---

## 4. Kiểm tra sức khỏe và log

Mọi lệnh trong mục này chạy ở `/root/chalo-coffee`.

### 4.1 Checklist 60 giây

```bash
cd /root/chalo-coffee
docker compose -f docker-compose.prod.yml ps
curl -fsS https://chalocoffee.com/api/health
df -h
free -h
docker system df
```

Kỳ vọng:

- `postgres`, `backend`, `frontend`, `caddy` là `Up`.
- Health API trả JSON có `"status":"ok"`.
- Phân vùng đĩa không gần 100%; RAM còn đủ cho build/restart.

### 4.2 Xem log

```bash
# 200 dòng gần nhất
docker compose -f docker-compose.prod.yml logs --tail=200 backend
docker compose -f docker-compose.prod.yml logs --tail=200 frontend
docker compose -f docker-compose.prod.yml logs --tail=200 caddy
docker compose -f docker-compose.prod.yml logs --tail=200 postgres

# Theo dõi liên tục, dừng bằng Ctrl+C
docker compose -f docker-compose.prod.yml logs -f backend
```

Tìm nhanh lỗi:

```bash
docker compose -f docker-compose.prod.yml logs --tail=500 backend | \
  grep -Ei 'error|exception|failed|migration|fatal'
```

### 4.3 Kiểm tra từng service

```bash
docker compose -f docker-compose.prod.yml exec backend sh
docker compose -f docker-compose.prod.yml exec postgres \
  pg_isready -U "$DB_USERNAME" -d "$DB_DATABASE"
docker inspect --format '{{.State.Status}} {{.State.ExitCode}}' \
  chalo-coffee-backend-1
```

Tên container thực tế có thể khác; lấy tên bằng `docker compose ... ps` trước.

---

## 5. Biến môi trường `.env`

### 5.1 Vị trí và nguyên tắc

```text
/root/chalo-coffee/.env              ← file thật, secret, không commit
/root/chalo-coffee/deploy/.env.example ← file mẫu trong Git
```

Xem tên biến (không in giá trị secret):

```bash
cd /root/chalo-coffee
cut -d= -f1 .env | sed '/^#/d;/^$/d'
```

Chỉnh file:

```bash
vi .env
```

Nếu đã cài `nano`:

```bash
nano .env
```

Mẹo `vi`: bấm `i` để sửa → `Esc` → gõ `:wq` → Enter để lưu. Thoát không lưu:
`Esc` → `:q!` → Enter.

Giới hạn quyền file:

```bash
chmod 600 .env
stat -c '%a %n' .env
```

### 5.2 Các nhóm biến quan trọng

| Nhóm | Ví dụ | Lưu ý |
|---|---|---|
| Public/domain | `PUBLIC_URL`, `SITE_ADDRESS`, `ACME_EMAIL` | Đổi domain phải rebuild frontend. |
| Database | `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | Không đổi khi chưa chuẩn bị migration/backup. |
| Auth | `JWT_SECRET`, `JWT_REFRESH_SECRET` | Hai giá trị mạnh và khác nhau. Đổi sẽ làm refresh token cũ hết hiệu lực. |
| Seed | `SEED_ON_STARTUP` | Production nên `false` sau khởi tạo. |
| Google | `GOOGLE_*` | Chỉ dùng secret trên VPS. |

### 5.3 Sau khi sửa `.env`

```bash
cd /root/chalo-coffee
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=150 backend frontend
```

`--build` là bắt buộc khi thay đổi `PUBLIC_URL` hoặc biến `NEXT_PUBLIC_*`, ví dụ
`GOOGLE_OAUTH_ENABLED`, vì Next.js nhúng chúng khi build.

---

## 6. Deploy tay và migration

### 6.1 Deploy tay chuẩn

Chỉ dùng khi Actions không chạy/thất bại hoặc sau khi sửa `.env`:

```bash
cd /root/chalo-coffee
git fetch origin
git status --short --branch
git reset --hard origin/main
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=200 backend frontend caddy
curl -fsS https://chalocoffee.com/api/health
```

`git reset --hard origin/main` an toàn ở đây vì deploy workflow cũng dùng nó và
source code VPS không phải nơi lưu chỉnh sửa. Tuy nhiên nó **xóa mọi sửa code
local trong repo VPS**, nên chỉ chạy khi chắc không ai đang sửa code trực tiếp tại đó.

### 6.2 Migration

Backend production chạy TypeORM migration lúc startup. Sau deploy, kiểm:

```bash
docker compose -f docker-compose.prod.yml logs --tail=300 backend | \
  grep -Ei 'migration|error|failed'
```

Không tự chạy `migration:revert` trên production chỉ để “thử”. Revert migration
có thể xóa cột/bảng dữ liệu mới. Backup database trước mọi thao tác migration tay.

### 6.3 Khi deploy bị OOM / `Killed`

```bash
free -h
df -h
docker stats --no-stream
```

Nếu thiếu RAM trong lúc `--build`, dừng các tiến trình không cần thiết, cân nhắc
thêm swap hoặc nâng VPS. Không xoá Docker volumes để giải phóng RAM.

---

## 7. Backup và khôi phục database

### 7.1 Backup bắt buộc trước thay đổi lớn

```bash
cd /root/chalo-coffee
set -a
. ./.env
set +a
mkdir -p backups
backup_file="backups/chalo_$(date +%F_%H%M%S).sql"
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U "$DB_USERNAME" "$DB_DATABASE" > "$backup_file"
test -s "$backup_file" && ls -lh "$backup_file"
```

Tạo checksum để đối chiếu khi tải về:

```bash
sha256sum "$backup_file" > "$backup_file.sha256"
```

### 7.2 Tải backup về máy cá nhân

Chạy **trên máy cá nhân**, không phải trong VPS:

```bash
scp root@221.132.21.65:/root/chalo-coffee/backups/chalo_YYYY-MM-DD_HHMMSS.sql .
scp root@221.132.21.65:/root/chalo-coffee/backups/chalo_YYYY-MM-DD_HHMMSS.sql.sha256 .
sha256sum -c chalo_YYYY-MM-DD_HHMMSS.sql.sha256
```

Backup chỉ nằm trên VPS không bảo vệ trước sự cố mất VPS. Giữ tối thiểu một bản
ngoài VPS, theo lịch định kỳ.

### 7.3 Khôi phục database

Khôi phục ghi dữ liệu vào DB hiện có; chỉ làm khi đã backup DB hiện tại và biết
chắc file nguồn. Tắt ứng dụng trước để tránh phát sinh đơn trong lúc restore:

```bash
cd /root/chalo-coffee
set -a
. ./.env
set +a
docker compose -f docker-compose.prod.yml stop backend frontend
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U "$DB_USERNAME" -d "$DB_DATABASE" < backups/ten_file.sql
docker compose -f docker-compose.prod.yml up -d backend frontend
curl -fsS https://chalocoffee.com/api/health
```

Nếu cần restore sang DB hoàn toàn rỗng hoặc dump có lệnh `CREATE DATABASE`, dừng
và nhờ người có kinh nghiệm PostgreSQL hỗ trợ trước — không đoán lệnh xóa schema.

### 7.4 Backup uploads

Ảnh upload nằm ở Docker volume `uploads_data`; database backup không bao gồm ảnh.
Xem volume trước:

```bash
docker volume ls | grep -E 'uploads|postgres'
```

Tạo archive volume (xác nhận chính xác tên volume từ lệnh trên trước):

```bash
docker run --rm -v <ten_uploads_volume>:/data -v /root/chalo-coffee/backups:/backup \
  alpine tar czf /backup/uploads_$(date +%F_%H%M%S).tar.gz -C /data .
```

---

## 8. Google đăng nhập

Google OAuth chỉ tạo account `CUSTOMER`. Staff/admin tiếp tục dùng account nội
bộ; admin có thể nâng role account Google sau khi tạo, từ màn quản lý nhân sự.

### 8.1 Google Cloud Console

Trong Google Cloud project của Chalo Coffee:

1. **Google Auth Platform** → Consent screen.
2. User type chọn **External**.
3. Thêm app name/email hỗ trợ/developer contact.
4. Scope cần: `openid`, `email`, `profile`.
5. Tạo OAuth Client loại **Web application**.
6. Nhập chính xác:

| Trường Google Console | Giá trị |
|---|---|
| Authorized JavaScript origins | `https://chalocoffee.com` |
| Authorized redirect URIs | `https://chalocoffee.com/api/auth/google/callback` |

Google so khớp redirect URI từng ký tự: HTTPS, domain, path và dấu `/` cuối đều
phải đúng. Không thêm IP VPS/wildcard nếu không thực sự dùng.

Khi app ở Testing, chỉ **Test users** được đăng nhập. Trước khi mở cho khách
thật, chuyển consent screen sang **Production**. Nếu Google yêu cầu xác minh
app/scope, thực hiện theo Console; hiện app chỉ dùng scope cơ bản.

### 8.2 `.env` trên VPS

```dotenv
GOOGLE_OAUTH_ENABLED=true
GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<client-secret>
GOOGLE_CALLBACK_URL=https://chalocoffee.com/api/auth/google/callback
```

Sau đó:

```bash
cd /root/chalo-coffee
chmod 600 .env
docker compose -f docker-compose.prod.yml up -d --build
```

### 8.3 Kiểm luồng OAuth

```bash
curl -sS -D - -o /dev/null \
  'https://chalocoffee.com/api/auth/google/start?returnTo=%2Faccount' | \
  grep -i '^location:'
```

Kỳ vọng header bắt đầu bằng:

```text
location: https://accounts.google.com/o/oauth2/v2/auth?...
```

Trên điện thoại/desktop:

1. Mở `https://chalocoffee.com/login`.
2. Bấm **Tiếp tục với Google**.
3. Chọn Gmail test/khách.
4. Sau callback phải vào `/account`, URL không còn `code`.
5. Quét QR bàn, đặt một đơn, staff thanh toán; điểm được cộng theo `floor(VND/1000)`.

### 8.4 Sự cố OAuth

| Hiện tượng | Nguyên nhân/cách xử lý |
|---|---|
| Nút Google không hiện | `GOOGLE_OAUTH_ENABLED=true` rồi `up -d --build`; frontend phải được rebuild. |
| “redirect_uri_mismatch” | So lại URI Console với `GOOGLE_CALLBACK_URL`, tuyệt đối chính xác. |
| “Access blocked” | Gmail chưa nằm trong Test users hoặc consent screen chưa Production. |
| “Found. Redirecting to” | Kiểm `Location` bằng curl ở mục 8.3; nếu rỗng xem log backend và kiểm commit deploy. |
| Secret bị lộ | Reset/rotate secret trong Google Console, sửa `.env`, rebuild/restart; không cần đổi QR bàn. |

Xem thêm [deploy/google-oauth.md](../../deploy/google-oauth.md).

---

## 9. Domain, HTTPS và DNS

### 9.1 DNS

Domain `chalocoffee.com` cần A record trỏ về `221.132.21.65`.

Kiểm từ máy cá nhân hoặc VPS:

```bash
getent hosts chalocoffee.com
curl -I https://chalocoffee.com
```

### 9.2 HTTPS/Caddy

Caddy tự xin và gia hạn Let's Encrypt khi:

- DNS trỏ đúng VPS.
- Firewall/Vietnix mở TCP 80 và 443.
- `SITE_ADDRESS=chalocoffee.com` trong `.env`.
- `ACME_EMAIL` hợp lệ trong `.env`.

Kiểm:

```bash
docker compose -f docker-compose.prod.yml logs --tail=300 caddy
curl -Iv https://chalocoffee.com
```

Nếu certificate lỗi, không xóa Caddy volume vội. Kiểm DNS/firewall/log trước.

### 9.3 Firewall tối thiểu

Chỉ public các cổng cần thiết: 22 (SSH), 80, 443.

```bash
ufw status numbered
```

Không mở 5432 (Postgres), 8080 (backend) hay 3000 (frontend) ra Internet.

---

## 10. Rollback, restart và bảo trì

### 10.1 Restart một service

```bash
cd /root/chalo-coffee
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml logs --tail=100 backend
```

Tương tự cho `frontend`, `caddy`, `postgres` — nhưng **không restart Postgres**
trong giờ vận hành trừ khi cần thiết.

### 10.2 Rollback code

Trước rollback: backup database. Xem commit:

```bash
cd /root/chalo-coffee
git log --oneline -15
```

Cách an toàn nhất là tạo commit revert trên GitHub/local, merge vào `main`, để
GitHub Actions deploy như bình thường. Chỉ dùng checkout commit trực tiếp cho
sự cố khẩn cấp:

```bash
cd /root/chalo-coffee
git branch backup-before-rollback-$(date +%F-%H%M)
git checkout <commit-tot>
docker compose -f docker-compose.prod.yml up -d --build
```

`git checkout <commit>` tạo detached HEAD. Ghi lại commit đang chạy và sau đó
phải tạo revert/branch đúng trên GitHub, nếu không push `main` tiếp theo sẽ ghi
đè rollback VPS.

Không revert database migration trừ khi đã backup, đọc kỹ migration `down` và
xác nhận mất dữ liệu là chấp nhận được.

### 10.3 Dọn Docker an toàn tương đối

Workflow auto-deploy đã chạy `docker image prune -f` để bỏ image dangling.
Khi ổ đĩa gần đầy, kiểm trước:

```bash
docker system df
docker image ls
docker volume ls
```

Không thêm `-a --volumes` vào prune khi chưa biết chính xác image/volume nào có
thể mất. Docker volume chứa database/uploads là dữ liệu production.

---

## 11. Sự cố thường gặp

| Hiện tượng | Kiểm tra đầu tiên | Hành động tiếp theo |
|---|---|---|
| Website không vào được | `docker compose ... ps` | Xem Caddy/frontend log, DNS, firewall 80/443. |
| API trả 502 | Log Caddy + backend | Backend có `Up`? DB có healthy? |
| API trả 500 | `logs --tail=300 backend` | Lấy error cụ thể, không restart mù quáng. |
| Backend restart liên tục | Backend log | Kiểm `.env`: DB/JWT/migration. |
| Deploy Actions đỏ | GitHub Actions log | Sửa source/SSH secret; không force push ngay. |
| VPS chưa nhận code mới | Actions status; `git log -1` trên VPS | Chờ workflow xong hoặc deploy tay theo mục 6. |
| Build bị `Killed` | `free -h`, `docker stats` | Thiếu RAM/OOM; thêm swap/nâng VPS. |
| Ổ đĩa đầy | `df -h`, `docker system df` | Backup trước, chỉ dọn image biết rõ. |
| Không tải được ảnh | `uploads` route/log backend | Kiểm volume uploads, quyền file và Caddy route. |
| QR bàn lỗi | Kiểm URL `/menu/<token>` | QR bàn cố định; chỉ admin regenerate QR mới đổi token. |
| Google “Found. Redirecting to” | Curl mục 8.3 | Header `Location` phải không rỗng. |

### Mẫu thông tin khi nhờ hỗ trợ

Không gửi secret. Gửi những dòng sau là đủ để chẩn đoán:

```bash
cd /root/chalo-coffee
git log -1 --oneline
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100 backend
curl -i https://chalocoffee.com/api/health
df -h
free -h
```

---

## 12. Bảo mật và lệnh nguy hiểm

### 12.1 Việc nên làm

- Đổi password VPS mặc định và password admin/staff mặc định nếu còn.
- Dùng SSH key thay password khi đã cấu hình xong.
- Cập nhật Ubuntu/Docker định kỳ trong giờ bảo trì.
- Giữ `.env` quyền `600`.
- Backup database + uploads định kỳ ra ngoài VPS.
- Rotate ngay JWT/Google secret khi nghi ngờ bị lộ.
- Chỉ cấp GitHub repository Actions secrets cho người tin cậy.

### 12.2 Không chạy tùy tiện trên production

```bash
docker compose down -v
docker system prune -a --volumes
docker volume rm ...
rm -rf ...
git clean -fd
git reset --hard        # trừ quy trình deploy VPS ở mục 6
```

Các lệnh trên có thể xóa database, uploads, SSL certificate, image cần rollback,
hoặc source local. Khi không chắc: dừng, backup và xem phạm vi chính xác trước.

---

## Lệnh tham khảo nhanh

```bash
# SSH
ssh root@221.132.21.65

# Vào dự án + kiểm tra service
cd /root/chalo-coffee
docker compose -f docker-compose.prod.yml ps

# Log backend
docker compose -f docker-compose.prod.yml logs -f backend

# Kiểm health public
curl -fsS https://chalocoffee.com/api/health

# Sau khi sửa .env
docker compose -f docker-compose.prod.yml up -d --build

# Backup DB
set -a; . ./.env; set +a
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U "$DB_USERNAME" "$DB_DATABASE" > backups/chalo_$(date +%F_%H%M%S).sql

# Kiểm Google redirect
curl -sS -D - -o /dev/null \
  'https://chalocoffee.com/api/auth/google/start?returnTo=%2Faccount' | grep -i '^location:'
```
