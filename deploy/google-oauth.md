# Cấu hình Google OAuth production

Hướng dẫn này dùng cho production một VPS, một backend instance và domain
`https://chalocoffee.com`. Google login chỉ tạo tài khoản `CUSTOMER`; việc đổi
role staff/admin vẫn thực hiện qua màn quản lý nhân sự hiện có.

## 1. Tạo OAuth client trong Google Cloud

1. Mở Google Cloud Console, chọn hoặc tạo project cho Chalo Coffee.
2. Vào **Google Auth Platform** và cấu hình consent screen:
   - App name: `Chalo Coffee`.
   - User support email và developer contact email: email quản trị của quán.
   - Scope chỉ cần `openid`, `email`, `profile`.
   - Chọn External. Khi còn Testing, thêm các tài khoản thử vào Test users;
     trước khi mở cho khách thật, chuyển app sang Production.
3. Tạo OAuth client loại **Web application**.
4. Khai báo chính xác:
   - Authorized JavaScript origins: `https://chalocoffee.com`
   - Authorized redirect URIs: `https://chalocoffee.com/api/auth/google/callback`

Không thêm wildcard, IP VPS hay redirect URL khác nếu production không dùng chúng.
Google so khớp redirect URI tuyệt đối, kể cả scheme, domain, path và dấu gạch
chéo cuối.

## 2. Khai báo biến môi trường trên VPS

Trong file `.env` ở root repo trên VPS:

```dotenv
PUBLIC_URL=https://chalocoffee.com
SITE_ADDRESS=chalocoffee.com

GOOGLE_OAUTH_ENABLED=true
GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<client-secret>
GOOGLE_CALLBACK_URL=https://chalocoffee.com/api/auth/google/callback
```

Chỉ lưu secret trong `.env` trên VPS, giới hạn quyền file và không dán nó vào
issue, log, screenshot hay repository:

```bash
chmod 600 .env
```

Luồng OAuth hiện lưu `state`, PKCE verifier và exchange code một lần trong bộ nhớ
process. Cấu hình này phù hợp với một backend container trên VPS hiện tại. Phải
chuyển store này sang Redis trước khi chạy nhiều backend replica.

## 3. Backup, migration và deploy

Backup PostgreSQL trước khi cập nhật:

```bash
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U "$DB_USERNAME" "$DB_DATABASE" > backup_before_google_oauth.sql
```

Build lại cả backend và frontend vì cờ `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED`
được nhúng vào frontend lúc build:

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs --tail=200 backend frontend
```

Backend production tự chạy TypeORM migrations khi khởi động. Nếu cần chạy thủ công
trong môi trường không dùng startup migration:

```bash
cd chalo-be
npm run migration:run
```

## 4. Kiểm tra sau deploy

```bash
curl -fsS https://chalocoffee.com/api/health
curl -I 'https://chalocoffee.com/api/auth/google/start?returnTo=/account'
```

Sau đó kiểm trên trình duyệt:

1. Mở `https://chalocoffee.com/login`; nút **Tiếp tục với Google** phải bấm được.
2. Đăng nhập một tài khoản Google; callback trở về `/account` và URL không
   còn exchange code sau khi hoàn tất.
3. Tài khoản mới phải có role `CUSTOMER`, không truy cập được trang staff/admin.
4. Đăng nhập admin bằng password và xác nhận luồng cũ vẫn hoạt động.

## 5. Rollback

Tắt OAuth an toàn mà không xóa tài khoản hay điểm đã có:

```dotenv
GOOGLE_OAUTH_ENABLED=false
```

Sau đó build lại frontend và restart stack:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Chỉ revert migration khi đã backup và chấp nhận xóa schema/dữ liệu của tính năng:

```bash
cd chalo-be
npm run migration:revert
```

Nếu client secret bị lộ, rotate secret ngay trong Google Cloud, cập nhật `.env` trên
VPS và restart backend. Không cần đổi QR bàn.
