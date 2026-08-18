# Nền tảng an toàn ứng dụng Chalo Coffee — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bảo vệ mutation dùng cookie, giới hạn bề mặt tấn công auth và chặn lộ credential trong log/chuỗi release.

**Architecture:** Backend dùng parser origin chung cho CORS và CSRF; CSRF chỉ áp dụng cho mutation có cookie session, còn Bearer và request không có cookie giữ nguyên. Logger redaction chạy trước khi format log. CI cài dependency lockfile của hai ứng dụng rồi chạy audit production, test và build độc lập.

**Tech Stack:** NestJS 11, Express 5, `@nestjs/throttler`, Joi, pnpm, GitHub Actions, Jest, Playwright Chromium.

## Global Constraints

- Không sao chép cookie HttpOnly, role redirect/PWA hay SSE từ PR #3; chỉ dùng `AUTH_COOKIES` hiện có để nhận diện request cookie-session.
- CORS chỉ cho credential với origin trong `CORS_ORIGIN`; request không có `Origin` hợp lệ cho health/CLI/server-to-server.
- CSRF chỉ chặn `POST`, `PUT`, `PATCH`, `DELETE` khi access/refresh cookie có mặt và origin thiếu hoặc ngoài allow-list.
- Không log giá trị query có tên token, secret, password, authorization, signature, api key hoặc key, không phân biệt hoa/thường.
- Production seed cần hai mật khẩu cấu hình, ít nhất 16 ký tự và không phải giá trị mặc định.
- Audit production dependency high/critical phải làm CI thất bại.
- Không đưa health/metrics, backup/restore, deploy smoke/rollback, SePay, tồn kho hoặc UI vào nhánh này.

---

## - [x] Task 1: CORS allow-list và request-log redaction

**Files:**
- Create: `chalo-be/src/config/cors.ts`, `chalo-be/src/config/cors.spec.ts`
- Create: `chalo-be/src/common/logging/redact-request-url.ts`, `chalo-be/src/common/logging/redact-request-url.spec.ts`
- Modify: `chalo-be/src/main.ts`, `chalo-be/src/common/middleware/request-logger.middleware.ts`

**Interfaces:** `parseAllowedOrigins(csv: string): Set<string>`; `buildCorsOriginPolicy(csv)` trả callback cho `app.enableCors`; `redactRequestUrl(url: string): string` chỉ dùng khi ghi log.

- [ ] Viết test CORS: normalize trailing slash, origin khai báo trả `true`, origin lạ trả `Error/false`, request thiếu Origin trả `true`; viết test `/api?token=x&page=2&apiKey=y` thành `/api?token=%5BREDACTED%5D&page=2&apiKey=%5BREDACTED%5D`.
- [ ] Chạy `pnpm test --runInBand --testPathPatterns='cors|redact-request-url'`; xác nhận FAIL vì hai module chưa tồn tại.
- [ ] Implement parser `csv.split(',').map(trim + bỏ slash cuối)`; CORS callback dùng allow-list và redactor dùng `new URL(url, 'http://chalo.internal')` để thay giá trị sensitive bằng `[REDACTED]`.
- [ ] Thay `origin: true` trong `main.ts` bằng policy và thay `req.originalUrl` logger bằng URL đã redaction.
- [ ] Chạy lại focused test và `pnpm build`; commit:
  ```bash
  git add chalo-be/src/config chalo-be/src/common/logging chalo-be/src/common/middleware/request-logger.middleware.ts chalo-be/src/main.ts
  git commit -m 'fix(be): giới hạn CORS và che URL nhạy cảm trong log'
  ```

## - [x] Task 2: CSRF origin guard và throttle endpoint auth

**Files:**
- Create: `chalo-be/src/common/middleware/csrf-origin.middleware.ts`, `chalo-be/src/common/middleware/csrf-origin.middleware.spec.ts`
- Modify: `chalo-be/src/app.module.ts`
- Modify: `chalo-be/src/modules/auth/auth.controller.ts`, `chalo-be/src/modules/auth/auth.controller.spec.ts`

**Interfaces:** `shouldRejectCookieMutation({ method, cookieHeader, origin, allowedOrigins }): boolean` dùng `parseAllowedOrigins`, `AUTH_COOKIES` và `readRequestCookie`.

- [ ] Viết test fail: POST với `chalo_access=jwt` từ `https://evil.example` bị reject; POST không cookie không bị reject; GET cookie không bị reject; POST same-origin được phép. Thêm assertion metadata throttle login `5/15 phút`, register `3/60 phút`, refresh `20/15 phút`.
- [ ] Chạy `pnpm test --runInBand --testPathPatterns='csrf-origin|auth.controller'`; xác nhận FAIL.
- [ ] Implement guard với `SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])`: chỉ khi không-safe và access/refresh cookie có mặt mới đòi origin allow-list. Đăng ký sau request logger trong `AppModule`.
- [ ] Thêm `@Throttle({ default: { limit, ttl } })` vào login/register/refresh, giữ contract cookie login/refresh hiện tại nguyên vẹn.
- [ ] Chạy `pnpm test --runInBand --testPathPatterns='csrf-origin|auth.controller|auth-cookie' && pnpm build`; commit:
  ```bash
  git add chalo-be/src/common/middleware/csrf-origin.middleware.ts chalo-be/src/common/middleware/csrf-origin.middleware.spec.ts chalo-be/src/app.module.ts chalo-be/src/modules/auth/auth.controller.ts chalo-be/src/modules/auth/auth.controller.spec.ts
  git commit -m 'fix(auth): chặn CSRF và giới hạn thử endpoint công khai'
  ```

## - [x] Task 3: Guard seed production, dependency audit và CI gate

**Files:**
- Modify: `chalo-be/src/seed/seed.service.ts`, `chalo-be/src/seed/seed.service.spec.ts`, `chalo-be/.env.example`
- Modify: `chalo-be/package.json`, `chalo-be/pnpm-lock.yaml`, `chalo-fe/package.json`, `chalo-fe/pnpm-lock.yaml`
- Create: `scripts/audit-production-dependencies.mjs`, `scripts/audit-production-dependencies.test.mjs`, `.github/workflows/ci.yml`

**Interfaces:** `assertProductionSeedPasswords()` throws before user creation on missing/unsafe production secrets. `evaluateVulnerabilityCounts(report): boolean` returns whether a report has high/critical findings; `node scripts/audit-production-dependencies.mjs [chalo-be|chalo-fe]` exits 1 if high/critical > 0 and 2 if audit JSON cannot be parsed.

- [ ] Viết test fail đặt `NODE_ENV=production`, `SEED_ON_STARTUP=true`, bỏ `SEED_ADMIN_PASSWORD`/staff và expect `onModuleInit()` reject. Viết Node test import `evaluateVulnerabilityCounts`: metadata `{ high: 1, critical: 0 }` trả `true`, còn `{ high: 0, critical: 0 }` trả `false`.
- [ ] Chạy `pnpm test --runInBand --testPathPatterns='seed.service'` và `node --test scripts/audit-production-dependencies.test.mjs`; xác nhận FAIL.
- [ ] Implement seed guard: cả hai password phải tồn tại, >=16 ký tự, không match `/^(admin|staff|password|your-.*password.*)$/i`; dev seed giữ `admin/staff`. Cập nhật env example.
- [ ] Cập nhật trực tiếp production dependency chỉ ở mức cần thiết để hết high/critical, tái tạo từng lockfile bằng `pnpm install --lockfile-only`. Audit script chạy `pnpm audit --prod --audit-level=high --json` từng app, đọc `metadata.vulnerabilities`.
- [ ] Tạo CI chạy trên PR/main push: cài frozen lockfile, backend Jest/build, frontend unit/build và audit script; không ghi secret trong workflow.
- [ ] Chạy:
  ```bash
  pnpm test --runInBand && pnpm build
  node --test scripts/audit-production-dependencies.test.mjs
  node scripts/audit-production-dependencies.mjs
  ```
  Trong `chalo-fe`: `pnpm test:unit && pnpm build`. Commit:
  ```bash
  git add chalo-be/src/seed chalo-be/.env.example chalo-be/package.json chalo-be/pnpm-lock.yaml chalo-fe/package.json chalo-fe/pnpm-lock.yaml scripts .github/workflows/ci.yml
  git commit -m 'chore: thêm cổng audit dependency production'
  ```

## - [x] Task 4: Browser regression, review và tài liệu bàn giao

**Files:**
- Modify: `docs/superpowers/specs/2026-08-18-security-operations-foundation-design.md`
- Modify: `docs/superpowers/plans/2026-08-18-security-operations-foundation.md`
- Create: `docs/superpowers/summaries/2026-08-18-security-operations-foundation-summary.md`

**Interfaces:** Không thêm behavior; tạo bằng chứng CSRF không làm hỏng PWA role session.

- [ ] Build frontend, chạy standalone ở 3060 và chạy:
  ```bash
  PLAYWRIGHT_BASE_URL=http://127.0.0.1:3060 pnpm exec playwright test e2e/auth-persistence.spec.ts e2e/home-role-redirect.spec.ts --project=chromium
  ```
  Kỳ vọng toàn bộ admin/staff/customer redirect và PWA restart pass, không có console/network lỗi mới.
- [ ] Chạy `git diff --check origin/main...HEAD`, `git diff --name-only origin/main...HEAD`, `git status --short`; xác nhận không có whitespace error, scope chỉ security/CI/docs.
- [ ] Tick từng task sau khi pass review. Thêm link summary ở mục `## Kết quả` của plan; summary bắt buộc có `Đã làm gì`, `File chính`, `Khác với plan`, `Còn dở / cần lưu ý`, chỉ nêu tên biến deploy chứ không nêu secret.
- [ ] Commit:
  ```bash
  git add docs/superpowers
  git commit -m 'docs: tổng kết PR an toàn ứng dụng'
  ```

## Kết quả

[Tổng kết thực thi](../summaries/2026-08-18-security-operations-foundation-summary.md)
