# Nền tảng an toàn và vận hành Chalo Coffee — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bảo vệ phiên đăng nhập và realtime, loại advisory dependency mức cao, đồng thời biến deployment thành quy trình có kiểm tra, quan sát và khôi phục được.

**Architecture:** Backend vẫn là NestJS qua Caddy cùng public origin, nhưng Auth phát JWT bằng HttpOnly cookies. JWT strategy nhận Bearer cho API máy-máy hoặc cookie cho browser; client không giữ credential. Một lớp platform riêng chuẩn hoá CORS/log/health/CI; các feature nghiệp vụ chỉ phụ thuộc vào các API bảo mật này.

**Tech Stack:** NestJS 11, Passport JWT, TypeORM/PostgreSQL, Next.js 16, Axios, Zustand, GitHub Actions, Caddy, Docker Compose, Playwright/Jest/node:test.

## Global Constraints

- Package manager: `pnpm`, chạy trong `chalo-be` hoặc `chalo-fe`.
- Không lưu password, JWT, refresh token, webhook key, dump DB hoặc backup thật trong git/log.
- Browser production chỉ gọi API qua cùng public origin `/api`; dev cross-port vẫn phải hoạt động bằng cookie không `Secure` nhưng `HttpOnly`.
- `USER_ROLE` chỉ phục vụ redirect UI, mọi quyền backend luôn lấy từ JWT đã verify.
- Không đổi enum `OrderStatus` hoặc thay đổi cách tính tiền/ca trong đợt này.
- Mỗi thay đổi production code phải có test RED trước, test GREEN sau; mọi thay đổi UI phải qua Playwright desktop và 375×667 trước khi báo xong.

---

- [x] Task 1: Nâng dependency an toàn và lập hàng rào kiểm tra

**Files:**
- Modify: `chalo-fe/package.json`, `chalo-fe/pnpm-lock.yaml`
- Modify: `chalo-be/package.json`, `chalo-be/pnpm-lock.yaml`
- Create: `scripts/audit-production-dependencies.mjs`
- Test: chạy `pnpm audit --prod --audit-level=high` tại từng package

**Interfaces:**
- Produces: Next.js >= `16.2.11`, Axios >= `1.18.0`, và script trả exit code khác 0 khi một package có advisory high/critical production.

- [x] Step 1: Ghi baseline audit vào commit message/plan và chạy `pnpm audit --prod --audit-level=high` trong hai package để chứng minh RED.
- [x] Step 2: Nâng `next`, `eslint-config-next`, `axios` và dependency backend theo phiên bản audit gợi ý bằng `pnpm up`; không dùng `--latest` không kiểm soát.
- [x] Step 3: Viết `scripts/audit-production-dependencies.mjs` gọi `pnpm audit --json`, parse metadata vulnerabilities và báo rõ package/level; script nhận mảng thư mục `['chalo-be', 'chalo-fe']`.
- [x] Step 4: Chạy audit xanh, `pnpm build`, backend `pnpm test`, frontend `pnpm test:unit`.
- [x] Step 5: Commit `chore: nâng dependency production an toàn`.

- [ ] Task 2: CORS, log redaction, seed và rate limit

**Files:**
- Create: `chalo-be/src/config/cors.ts`
- Create: `chalo-be/src/config/cors.spec.ts`
- Create: `chalo-be/src/common/logging/redact-request-url.ts`
- Create: `chalo-be/src/common/logging/redact-request-url.spec.ts`
- Modify: `chalo-be/src/main.ts`
- Modify: `chalo-be/src/common/middleware/request-logger.middleware.ts`
- Modify: `chalo-be/src/modules/auth/auth.controller.ts`
- Modify: `chalo-be/src/seed/seed.service.ts`
- Modify: `chalo-be/src/seed/seed.service.spec.ts`
- Modify: `chalo-be/.env.example`, `docker-compose.prod.yml`

**Interfaces:**
- Produces: `buildCorsOriginPolicy(csv: string): (origin, callback) => void`; `redactRequestUrl(url: string): string`; protected seed passwords sourced only from `SEED_ADMIN_PASSWORD`/`SEED_STAFF_PASSWORD`; `@Throttle({ default: { limit, ttl } })` on public auth methods.

- [ ] Step 1: Viết test fail: allow `https://chalocoffee.com`, reject foreign/null origin in production; redact `token`, `refreshToken`, `clientSecret`, password/key query values nhưng giữ đường dẫn và query không nhạy cảm.
- [ ] Step 2: Implement CORS callback from trimmed `CORS_ORIGIN`, reject unknown browser origins, and replace unused `corsOrigins`/`origin: true` in `main.ts`.
- [ ] Step 3: Route logger through `redactRequestUrl`; never stringify headers/body in logs.
- [ ] Step 4: Viết test fail rồi sửa seed: production `SEED_ON_STARTUP=true` phải throw when either secret absent/placeholder/weak; create hashes from env, never literals `admin`/`staff`. Update `.env.example` and compose comment.
- [ ] Step 5: Thêm metadata throttle: login 5/15 phút/IP, register 3/60 phút/IP, refresh 20/15 phút/IP; verify controller metadata in unit tests.
- [ ] Step 6: Run backend tests/build, then commit `fix(be): siết CORS log seed và auth throttle`.

- [ ] Task 3: Chuyển Auth sang HttpOnly cookie và SSE không lộ token

**Files:**
- Create: `chalo-be/src/modules/auth/auth-cookie.ts`
- Create: `chalo-be/src/modules/auth/auth-cookie.spec.ts`
- Modify: `chalo-be/src/modules/auth/auth.controller.ts`
- Modify: `chalo-be/src/modules/auth/google-oauth.controller.ts`
- Modify: `chalo-be/src/modules/auth/google-oauth.service.ts`
- Modify: `chalo-be/src/modules/auth/strategies/jwt.strategy.ts`
- Modify: `chalo-be/src/modules/sse/sse.controller.ts`
- Modify: `chalo-fe/src/constants/auth.ts`
- Modify: `chalo-fe/src/stores/auth.store.ts`
- Modify: `chalo-fe/src/lib/api-client.ts`
- Modify: `chalo-fe/src/services/auth/auth.helper.ts`
- Modify: `chalo-fe/src/hooks/useSSE.ts`
- Modify: `chalo-fe/src/app/(admin)/admin/orders/page.tsx`
- Modify: `chalo-fe/src/app/(staff)/staff/orders/page.tsx`
- Test: `chalo-be/src/modules/auth/*.spec.ts`, `chalo-fe/src/stores/auth.store.test.mts`, `chalo-fe/src/hooks/useSSE.test.mts`, `chalo-fe/e2e/auth-cookie-session.spec.ts`

**Interfaces:**
- Produces: `setAuthCookies(res, tokens, role, isProduction)`, `clearAuthCookies(res, isProduction)`, cookie names `chalo_access`, `chalo_refresh`, `chalo_role`; `JwtStrategy` supports `Authorization` then `req.cookies.chalo_access`; frontend persisted auth state contains only user/profile hydration, never token; `useSSE` takes no token argument.

- [ ] Step 1: Viết fail tests cho cookie flags: access/refresh `httpOnly`, `sameSite: 'strict'`, `secure` only production, refresh path `/api/auth`, and role cookie is non-sensitive; test JWT extractor prefers Bearer then cookie.
- [ ] Step 2: Implement cookie helpers and use them for login/register/refresh/logout. Make response body return only user (or no token); accept refresh token from HttpOnly cookie, preserving a temporary DTO fallback only for machine clients with explicit Bearer authentication.
- [ ] Step 3: Modify Google exchange/callback so successful browser exchange sets the same cookies before redirect; remove tokens from query and transient browser storage.
- [ ] Step 4: Write RED test for SSE URL then remove `?token=` from hook, controller Swagger and JWT query extractor. Staff pages subscribe with same-origin EventSource credentials.
- [ ] Step 5: Rewrite frontend auth store/api interceptors: `withCredentials: true`, no token Authorization in browser, no persisted credential, refresh invokes cookie endpoint. Keep user hydration through `/auth/me`; role redirect reads only `chalo_role`.
- [ ] Step 6: Add CSRF origin/header policy for unsafe same-site cookie requests, exempt only signature-verified payment webhook routes; test allowed same origin/rejected foreign origin.
- [ ] Step 7: Run targeted tests, full FE/BE suites and Playwright login → restart PWA → admin dashboard/staff POS → logout at desktop and 375×667. Commit `feat(auth): chuyển phiên browser sang HttpOnly cookie`.

- [ ] Task 4: Observability, health và release safety

**Files:**
- Create: `chalo-be/src/common/logging/request-context.middleware.ts`
- Create: `chalo-be/src/common/logging/request-context.middleware.spec.ts`
- Create: `chalo-be/src/modules/health/health.controller.spec.ts`
- Create: `chalo-be/src/modules/health/metrics.controller.ts`
- Modify: `chalo-be/src/modules/health/health.controller.ts`
- Modify: `chalo-be/src/modules/health/health.module.ts`
- Modify: `chalo-be/src/app.module.ts`
- Modify: `docker-compose.prod.yml`
- Modify: `.github/workflows/deploy.yml`
- Create: `.github/workflows/ci.yml`
- Create: `scripts/backup-postgres.sh`
- Create: `scripts/restore-postgres.sh`
- Create: `deploy/BACKUP_AND_RECOVERY.md`
- Modify: `deploy/README.md`

**Interfaces:**
- Produces: `/api/health/live` (process), `/api/health/ready` (DB+memory), `/api/metrics` restricted by `METRICS_TOKEN`; every log has `requestId`; CI reusable green gates; backup scripts require explicit env vars `BACKUP_DIR`, `POSTGRES_CONTAINER`, and never overwrite an existing target without `--confirm-restore`.

- [ ] Step 1: Write RED health tests: liveness has no DB dependency; readiness fails when DB indicator fails; metrics rejects missing/bad bearer token.
- [ ] Step 2: Implement request-id middleware and structured log fields; preserve existing human-readable production logs but add request id and redacted URL.
- [ ] Step 3: Implement health split and a minimal Prometheus/OpenTelemetry-compatible metrics endpoint (request count, duration, readiness); only expose with token.
- [ ] Step 4: Write backup/restore shell scripts with `set -euo pipefail`, explicit required variables, timestamped `pg_dump` + uploads archive, checksum and no destructive restore without exact confirmation. Document a staging restore drill.
- [ ] Step 5: Add Docker API healthchecks and CI jobs: frozen install, audit script, backend test/build, frontend unit/build and Playwright using compose; deploy job needs CI success, waits readiness, performs `/api/health/ready` smoke test and retains last known image until success.
- [ ] Step 6: Run shellcheck if available, compose config validation, all app tests/builds; commit `feat(ops): thêm health CI backup và quan sát an toàn`.

- [ ] Task 5: Kiểm chứng release foundation và cập nhật tài liệu

**Files:**
- Modify: `docs/superpowers/specs/2026-08-17-platform-foundation-design.md`
- Modify: `docs/superpowers/plans/2026-08-17-platform-foundation.md`
- Create: `docs/superpowers/summaries/2026-08-17-platform-foundation-summary.md`
- Test: FE/BE full suites, audit, compose config, Playwright evidence

**Interfaces:**
- Produces: evidence matrix mapping seven acceptance criteria in spec to a command/test/browser run; summary links spec + plan.

- [ ] Step 1: Run fresh production audit and record zero high/critical result.
- [ ] Step 2: Run backend test/build and frontend test:unit/build; run Playwright flow with browser console/network checks at desktop and 375×667.
- [ ] Step 3: Tick every verified task/step in this plan, update spec if implementation chose a safer equivalent, and write the required outcome summary from actual diff/commits.
- [ ] Step 4: Commit `docs: tổng kết nền tảng an toàn vận hành`.

## Kết quả

Xem [summary nền tảng](../summaries/2026-08-17-platform-foundation-summary.md) sau khi toàn bộ task được kiểm chứng.
