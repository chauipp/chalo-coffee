[Thiết kế](../specs/2026-08-17-pwa-install-design.md) · [Kế hoạch](../plans/2026-08-17-pwa-install.md)

# Bàn giao PWA cài đặt Chalo Coffee

## Đã làm gì

- Xác nhận manifest production khai báo chế độ mở độc lập cùng hai icon PWA 192×192 và 512×512.
- Kiểm chứng service worker được kích hoạt, tạo cache `chalo-static-*`, và không lưu hay trả cache cho API.
- Xác nhận notice cài đặt chỉ xuất hiện khi Chromium mobile phát sự kiện cài đặt hợp lệ; nút “Để sau” ẩn notice trong phiên.
- Xác nhận desktop và chế độ display đã cài đặt không hiển thị notice; giao diện mobile 375×667 không tràn ngang.
- Chạy bộ kiểm thử unit, typecheck, build production standalone và E2E Chromium trên cổng loopback mới.

## File chính

- `chalo-fe/e2e/pwa-install.spec.ts`: fixture production E2E kiểm manifest, worker/cache, prompt và ranh giới network của API.
- `docs/superpowers/plans/2026-08-17-pwa-install.md`: ghi nhận Task 3 đã hoàn tất.
- `docs/superpowers/summaries/2026-08-17-pwa-install-summary.md`: tài liệu bàn giao kết quả nghiệm thu PWA.

## Khác với plan

Không lệch. Build dùng `NEXT_PUBLIC_API_BASE_URL` trỏ về chính cổng standalone của phiên kiểm để route Playwright có thể chứng minh request `/api/customer/table-session` thực sự đi qua network sau khi worker đã active.

## Còn dở / cần lưu ý

Không. Lệnh unit hiện có cảnh báo `MODULE_TYPELESS_PACKAGE_JSON` của Node cho các module TypeScript; đây là cảnh báo có sẵn, không ảnh hưởng kết quả 42/42 test xanh.
