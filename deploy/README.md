# Triển khai Chalo Coffee lên VPS (Docker + Caddy + tên miền)

Hướng dẫn đưa `chalocoffee.com` lên internet bằng 1 VPS. Toàn bộ stack chạy trong
Docker: **Postgres + Backend (NestJS) + Frontend (Next.js) + Caddy (reverse proxy + SSL tự động)**.

Kiến trúc 1 tên miền, định tuyến theo path:

```
Internet ──HTTPS──> Caddy ┬─ /api/*     ─> backend  (NestJS, cổng 8080)
                          ├─ /uploads/* ─> backend  (file đã upload)
                          └─ /*         ─> frontend (Next.js, cổng 3000)
                                             backend ─> postgres (cổng 5432, chỉ nội bộ)
```

---

## 1. Chuẩn bị (làm 1 lần)

### 1.1. Mua VPS
- Tối thiểu **2GB RAM / 2 vCPU** (build Next.js khá ngốn RAM; nếu chỉ 1GB dễ bị kill khi build).
- Gợi ý: Hetzner CX22, Vultr/DigitalOcean vùng Singapore, hoặc VNG/Viettel (thanh toán VND).
- OS: **Ubuntu 24.04 LTS**.

### 1.2. Mua tên miền & trỏ DNS
Tạo bản ghi **A** trỏ về IP của VPS:

| Type | Name | Value          |
|------|------|----------------|
| A    | `@`  | `<IP_VPS>`     |
| A    | `www`| `<IP_VPS>`     |

Đợi DNS lan (vài phút–vài giờ). Kiểm tra: `ping chalocoffee.com` phải ra đúng IP VPS
**trước khi** chạy Caddy (nếu chưa trỏ đúng, Caddy sẽ không xin được SSL).

### 1.3. Mở firewall
Chỉ cần mở cổng 22 (SSH), 80, 443:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## 2. Cài Docker trên VPS
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER    # rồi logout/login lại để có quyền chạy docker không cần sudo
```
Kiểm tra: `docker --version` và `docker compose version`.

---

## 3. Đưa code lên VPS
```bash
git clone git@github.com:chauipp/chalo-coffee.git
cd chalo-coffee
```
(Nếu VPS chưa có quyền pull private repo: dùng HTTPS + Personal Access Token, hoặc thêm deploy key.)

---

## 4. Tạo file cấu hình `.env`
```bash
cp deploy/.env.example .env
nano .env
```
Điền các giá trị (xem chú thích trong file). **Bắt buộc:**
- Chọn **chế độ phục vụ**:
  - Chạy thử bằng IP (HTTP): `PUBLIC_URL=http://<IP_VPS>` và `SITE_ADDRESS=:80`
  - Chính thức bằng tên miền (HTTPS): `PUBLIC_URL=https://<tên_miền>`, `SITE_ADDRESS=<tên_miền>`, `ACME_EMAIL=email_của_bạn`
- `DB_PASSWORD` — mật khẩu DB mạnh:  `openssl rand -base64 24`
- `JWT_SECRET` và `JWT_REFRESH_SECRET` — hai giá trị **khác nhau**:  `openssl rand -hex 32`
  (backend sẽ **từ chối khởi động** nếu để giá trị mặc định.)

---

## 5. Build & chạy
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
Lần đầu build mất vài phút. Xem log:
```bash
docker compose -f docker-compose.prod.yml logs -f
```
- Migrations **tự chạy** khi backend khởi động (`NODE_ENV=production`), tạo sẵn schema DB.
- Chế độ IP: mở `http://<IP_VPS>`. Chế độ tên miền: Caddy tự xin SSL Let's Encrypt (~30–60s), mở `https://<tên_miền>`.

> 🔁 **Đổi từ chế độ IP sang tên miền sau này:** sửa `PUBLIC_URL` + `SITE_ADDRESS` trong `.env`, trỏ DNS tên miền về IP VPS, rồi chạy lại `docker compose -f docker-compose.prod.yml up -d --build` (phải có `--build` vì frontend nhúng cứng `PUBLIC_URL`).

---

## 6. Tạo dữ liệu ban đầu (tài khoản + menu + bàn)

Trên **production** (`NODE_ENV=production`), seed đã được thiết kế **an toàn**:
- Chỉ tạo: **tài khoản đăng nhập** (admin/staff), **menu** (danh mục + món), **30 bàn**.
- **KHÔNG** tạo đơn hàng giả. **KHÔNG** xoá dữ liệu.
- **Idempotent**: nếu DB đã có dữ liệu thì bỏ qua — chạy lại nhiều lần cũng không nhân đôi hay mất data.

**Các bước:**
1. Ở lần deploy đầu, trong `.env` đặt `SEED_ON_STARTUP=true` rồi khởi động:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build backend
   ```
2. Đăng nhập `https://chalocoffee.com` bằng `admin / admin` (và `staff / staff`) → **đổi mật khẩu ngay**.
3. (Khuyến nghị) Đặt lại `SEED_ON_STARTUP=false` trong `.env` rồi chạy lại — cho gọn, tránh chạy seed thừa mỗi lần khởi động:
   ```bash
   docker compose -f docker-compose.prod.yml up -d backend
   ```
4. Vào giao diện quản trị **chỉnh menu/bàn** theo quán thật của bạn (menu mẫu là điểm khởi đầu để sửa).

> 💡 Vì seed idempotent, kể cả lỡ quên đặt `false` thì các lần khởi động sau vẫn an toàn (nó tự bỏ qua khi thấy đã có dữ liệu). Muốn seed lại từ đầu thì phải xoá sạch DB trước.

---

## 7. Vận hành hằng ngày

**Xem log:**
```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f caddy   # soi lỗi SSL nếu có
```

**Cập nhật code mới (deploy phiên bản mới):**
```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
# Migration mới (nếu có) tự chạy khi backend khởi động lại.
```
> Lưu ý: nếu đổi `DOMAIN`, phải build lại **frontend** vì `NEXT_PUBLIC_API_BASE_URL`
> được nhúng cứng vào bundle lúc build.

**Sao lưu database:**
```bash
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U "$DB_USERNAME" "$DB_DATABASE" > backup_$(date +%F).sql
```

**Khôi phục:**
```bash
cat backup_YYYY-MM-DD.sql | docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U "$DB_USERNAME" -d "$DB_DATABASE"
```

**Dữ liệu bền** nằm trong Docker volumes (không mất khi rebuild container):
- `postgres_data` — database
- `uploads_data` — ảnh/file đã upload
- `caddy_data` — chứng chỉ SSL

---

## 8. Xử lý sự cố nhanh
| Triệu chứng | Nguyên nhân thường gặp |
|---|---|
| Không vào được HTTPS, Caddy log báo ACME lỗi | DNS chưa trỏ đúng IP, hoặc cổng 80/443 bị firewall chặn |
| Backend restart liên tục | JWT secret còn giá trị mặc định, hoặc sai thông tin DB trong `.env` |
| Frontend gọi API ra `localhost` | Đổi domain nhưng chưa build lại frontend (`--build`) |
| Build frontend bị OOM (killed) | VPS thiếu RAM — nâng lên 2GB, hoặc thêm swap |
