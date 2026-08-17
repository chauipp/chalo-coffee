# Sao lưu và khôi phục PostgreSQL

Hai script này chỉ chạy trên máy có Docker đang vận hành production. Chúng không đọc password từ tham số dòng lệnh và không tự tạo hoặc ghi đè thư mục backup.

## Sao lưu

```bash
mkdir -p /srv/chalo-backups
export BACKUP_DIR=/srv/chalo-backups
export POSTGRES_CONTAINER=chalo-coffee-postgres-1
export BACKEND_CONTAINER=chalo-coffee-backend-1
export DB_USERNAME=chalo_user
export DB_DATABASE=chalo_coffee
./scripts/backup-postgres.sh
```

Script tạo dump custom-format, archive `uploads` và file SHA-256 tương ứng. Chép cả bốn file sang một nơi độc lập với VPS (object storage hoặc máy khác) và kiểm tra có thể đọc lại định kỳ.

## Diễn tập khôi phục

Không khôi phục thẳng production để thử. Tạo database/container staging riêng, đặt `POSTGRES_CONTAINER` và `DB_DATABASE` của staging, rồi chạy:

```bash
export BACKUP_FILE=/srv/chalo-backups/chalo-postgres-chalo_coffee-YYYYMMDDTHHMMSSZ.dump
./scripts/restore-postgres.sh --confirm-restore=chalo_coffee_staging --restore-uploads
```

Script bắt buộc file checksum hợp lệ và câu xác nhận đúng chính xác tên database đích. `--restore-uploads` chỉ được dùng khi đã đặt `BACKEND_CONTAINER`; nó thay thế nội dung `/app/uploads` của container đích. Lệnh khôi phục xóa các object hiện có của **database đích**, nên cần kiểm tra biến môi trường trước khi bấm chạy.
