# Customer Google Login, Shortcut Bàn và Tích điểm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho khách đăng nhập Google, tích điểm chính xác theo đơn đã thanh toán và có lối tắt cá nhân quay lại bàn trong khi vẫn giữ luồng QR vãng lai hiện có.

**Architecture:** NestJS là nguồn sự thật cho danh tính Google, đơn thuộc khách, sổ cái điểm và lối tắt bàn cá nhân. Next.js chỉ lưu JWT/giỏ cục bộ; mọi quyết định hiển thị “tiếp tục gọi món” phải dựa trên API shortcut server. QR token của bàn luôn cố định và chỉ admin được tạo lại qua endpoint hiện hữu.

**Tech Stack:** NestJS 11, TypeORM/PostgreSQL, Passport/JWT, Google OAuth 2.0 Authorization Code + PKCE, Next.js 16/React 19, Zustand, TanStack Query, Zod, Playwright, Jest.

## Global Constraints

- Google OAuth chỉ tạo tài khoản `CUSTOMER`; không có API hoặc callback nào tự tăng quyền.
- Admin được đổi vai trò tài khoản Google có sẵn thành `MODERATOR`/`ADMIN` qua `PUT /user/update`; JWT sau refresh/login phải dùng role mới.
- Khách vãng lai quét QR và đặt món không cần đăng nhập, không tích điểm và không được regression.
- QR token cố định theo bàn; không đổi khi thanh toán, qua ngày hoặc hết shortcut. Chỉ `PUT /table/regenerate-qr` của admin đổi token.
- Một điểm cho mỗi 1.000 VND, `Math.floor(totalAmount / 1000)`, chỉ cộng sau thanh toán; điểm không hết hạn.
- Mỗi máy giữ giỏ hàng local riêng; nhiều máy cùng QR không chia sẻ giỏ trước khi đặt.
- Shortcut bàn là dữ liệu cá nhân, không giữ/khóa bàn và không phân biệt nhóm cũ/nhóm mới. Quét QR luôn vào menu ngay.
- Shortcut hết hạn lúc 00:00 giờ Việt Nam hoặc sau 30 phút không hoạt động kể từ thanh toán cuối của chính khách; khách khác không ảnh hưởng shortcut này.
- Mọi UI mới ưu tiên mobile, vùng chạm tối thiểu 44px, không bị che safe-area và phải xác minh với Playwright trước khi hoàn thành phase.
- Không commit `AGENTS.md`, `CLAUDE.md`, `.claude/skills/` hoặc các thay đổi local dotagents ngoài phạm vi.

---

## Cấu trúc file và ranh giới

| File | Trách nhiệm |
|---|---|
| `chalo-be/src/migrations/<timestamp>-CustomerGoogleLoyalty.ts` | Thay đổi schema có rollback cho Google identity, đơn khách, shortcut bàn và sổ cái điểm. |
| `chalo-be/src/modules/customer/*` | Entity, service, controller và DTO riêng cho shortcut khách/điểm/lịch sử; không làm phình module auth/order. |
| `chalo-be/src/modules/auth/google-oauth.service.ts` | Tạo state/PKCE, đổi code Google, xác minh ID token và phát exchange code một lần. |
| `chalo-be/src/modules/auth/auth.service.ts` | Tạo/tìm Google user, phát JWT và phản ánh role hiện tại khi refresh. |
| `chalo-be/src/modules/order/order.service.ts` | Gắn `customerId` chỉ khi JWT customer có shortcut đúng token và ghi điểm idempotent lúc thanh toán. |
| `chalo-fe/src/services/customer/*` | API/types/queries cho hồ sơ, shortcut, quét QR, điểm, lịch sử. |
| `chalo-fe/src/app/(customer)/account/*` | Trang tài khoản mobile-first và bộ quét QR. |
| `chalo-fe/src/app/(auth)/oauth/google/callback/page.tsx` | Đổi exchange code lấy JWT, lưu auth store và điều hướng an toàn. |
| `chalo-fe/src/app/_components/PublicLanding.tsx` | Header tài khoản và shortcut giỏ được xác minh từ server. |
| `chalo-fe/src/app/(customer)/menu/[tableToken]/*` | Logo về landing và liên kết shortcut cho khách đã đăng nhập, không đổi cart local. |

## Phase 1 — Backend identity, schema và an toàn OAuth

- [x] Task 1: Migration và entity cho khách hàng/điểm/shortcut

**Files:**
- Create: `chalo-be/src/migrations/<timestamp>-CustomerGoogleLoyalty.ts`
- Create: `chalo-be/src/modules/customer/entities/customer-table-session.entity.ts`
- Create: `chalo-be/src/modules/customer/entities/loyalty-point-transaction.entity.ts`
- Modify: `chalo-be/src/modules/user/entities/user.entity.ts`
- Modify: `chalo-be/src/modules/order/entities/order.entity.ts`
- Modify: `chalo-be/src/app.module.ts`
- Test: `chalo-be/src/modules/customer/entities/customer-loyalty.entity.spec.ts`

**Interfaces:**
- Produces `CustomerTableSession` with `customerId: number`, `tableId: string`, `tableToken: string`, `status: 'ACTIVE' | 'CLOSED' | 'EXPIRED'`, `startedAt`, `lastActivityAt`, `paidAt`, `endedAt`, `businessDate`, `endedReason`.
- Produces `LoyaltyPointTransaction` with unique `orderId`, `customerId`, `points`, `type: 'EARN'`.
- Adds nullable `users.googleSubject`, `users.email`, `orders.customerId`.

- [ ] **Step 1: Write failing entity/schema tests**

```ts
it('cho phép nhiều shortcut active của khách khác nhau tại cùng một bàn', () => {
  expect(sessionA.tableId).toBe(sessionB.tableId);
  expect(sessionA.customerId).not.toBe(sessionB.customerId);
});

it('mỗi order chỉ có tối đa một giao dịch tích điểm', () => {
  expect(loyaltyTransaction.orderId).toBe('order-1');
  expect(loyaltyTransaction).toMatchObject({ type: 'EARN', points: 100 });
});
```

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- customer-loyalty.entity.spec.ts --runInBand`

Expected: FAIL because the entities/schema do not yet exist.

- [ ] **Step 3: Implement migration and TypeORM entities**

```ts
@Index({ unique: true })
@Column({ type: 'uuid', nullable: true })
orderId: string | null;

@Column({ type: 'timestamp with time zone', nullable: true })
paidAt: Date | null;
```

Add nullable unique `googleSubject` and `email`; use a foreign key/index for `orders.customerId`; add indexes for active-session lookup (`customerId`, `status`, `businessDate`) and customer point ledger. Implement `up` and exact reverse `down`; do not alter existing table QR data.

- [ ] **Step 4: Run migration/entity verification**

Run: `npm test -- customer-loyalty.entity.spec.ts --runInBand && npm run build`

Expected: PASS and Nest compilation succeeds.

- [ ] **Step 5: Commit**

```bash
git add chalo-be/src/migrations chalo-be/src/modules/customer/entities chalo-be/src/modules/user/entities/user.entity.ts chalo-be/src/modules/order/entities/order.entity.ts chalo-be/src/app.module.ts
git commit -m "feat: add customer loyalty data model"
```

- [x] Task 2: Google OAuth backend with one-time exchange code

**Files:**
- Create: `chalo-be/src/modules/auth/google-oauth.service.ts`
- Create: `chalo-be/src/modules/auth/google-oauth.controller.ts`
- Create: `chalo-be/src/modules/auth/dto/google-oauth.dto.ts`
- Modify: `chalo-be/src/modules/auth/auth.module.ts`
- Modify: `chalo-be/src/modules/auth/auth.service.ts`
- Modify: `chalo-be/src/modules/user/user.service.ts`
- Modify: `chalo-be/src/config/env.validation.ts`
- Test: `chalo-be/src/modules/auth/google-oauth.service.spec.ts`

**Interfaces:**
- Produces `GET /api/auth/google/start?returnTo=/account`, `GET /api/auth/google/callback`, `POST /api/auth/google/exchange`.
- `POST /api/auth/google/exchange` consumes `{ code: string }` once and returns existing `LoginResponse` shape.
- `AuthService.loginWithGoogle(profile)` returns a user whose initial `role` is `CUSTOMER` only.

- [ ] **Step 1: Write failing OAuth tests**

```ts
it('creates a CUSTOMER from a verified Google subject and never trusts a role from Google', async () => {
  const result = await service.loginWithGoogle(verifiedProfile);
  expect(result.user.role).toBe(UserRole.CUSTOMER);
});

it('rejects a reused or expired exchange code', async () => {
  await expect(service.exchange('used-code')).rejects.toThrow(UnauthorizedException);
});
```

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- google-oauth.service.spec.ts --runInBand`

Expected: FAIL because Google OAuth service and endpoints are absent.

- [ ] **Step 3: Implement OAuth flow**

```ts
type VerifiedGoogleProfile = {
  subject: string;
  email: string;
  emailVerified: true;
  fullName: string;
  avatar: string | null;
};

async exchange(code: string): Promise<LoginResponse> {
  const record = this.exchangeCodes.consume(code); // atomic one-time consume
  if (!record || record.expiresAt <= new Date()) throw new UnauthorizedException();
  return this.authService.issueLoginResponse(record.user);
}
```

Generate cryptographically random `state`, PKCE verifier/challenge and exchange code. Persist short-lived state/exchange records in an injectable store suitable for a single VPS first; document that scale-out requires Redis. Validate issuer, Google client ID audience, signature, expiry and `email_verified`; never place JWT in redirect URL. Add required `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `FRONTEND_URL` validation as optional-in-development but mandatory when `GOOGLE_OAUTH_ENABLED=true`.

- [ ] **Step 4: Keep role promotions valid**

Add `UserService.findByGoogleSubject`, `findOrCreateGoogleCustomer`, and ensure `refresh()` loads the database user and signs tokens with `user.role`, not stale JWT role. This lets an admin use current `PUT /user/update` to promote the account without adding a second promotion API.

- [ ] **Step 5: Run backend verification**

Run: `npm test -- google-oauth.service.spec.ts auth.service.spec.ts --runInBand && npm run build`

Expected: all green; a Google profile cannot choose an elevated role and a promoted user refreshes with the database role.

- [ ] **Step 6: Commit**

```bash
git add chalo-be/src/modules/auth chalo-be/src/modules/user/user.service.ts chalo-be/src/config/env.validation.ts
git commit -m "feat: add secure Google customer sign-in"
```

- [x] Task 3: Customer shortcut API and expiry rules

**Files:**
- Create: `chalo-be/src/modules/customer/customer.module.ts`
- Create: `chalo-be/src/modules/customer/customer.controller.ts`
- Create: `chalo-be/src/modules/customer/customer.service.ts`
- Create: `chalo-be/src/modules/customer/dto/scan-table.dto.ts`
- Modify: `chalo-be/src/app.module.ts`
- Test: `chalo-be/src/modules/customer/customer.service.spec.ts`

**Interfaces:**
- Produces `GET /api/customer/me`, `GET /api/customer/table-session`, `POST /api/customer/table-session/scan`, `POST /api/customer/table-session/leave`, `GET /api/customer/loyalty`, `GET /api/customer/orders`.
- `scanTable(customerId, { tableToken })` validates table QR then creates/updates only that customer’s shortcut.
- `getActiveShortcut(customerId, now)` returns `null` after VN midnight or 30 minutes after `max(paidAt, lastActivityAt)` when paid and idle.

- [ ] **Step 1: Write failing service tests**

```ts
it('does not let one customer scanning a table close another customer shortcut', async () => {
  await service.scanTable(customerB.id, { tableToken: 'table-a' });
  expect(await service.getActiveShortcut(customerA.id, now)).toMatchObject({ tableToken: 'table-a' });
});

it('expires a paid shortcut after 30 idle minutes but preserves the stable table QR', async () => {
  const shortcut = await service.getActiveShortcut(customer.id, atThirtyOneMinutes);
  expect(shortcut).toBeNull();
  expect(table.qrToken).toBe('fixed-print-qr');
});
```

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- customer.service.spec.ts --runInBand`

Expected: FAIL because service/endpoints do not exist.

- [ ] **Step 3: Implement exact expiry and scan behavior**

```ts
if (session.businessDate !== businessDateVN(now)) return expire(session, 'DAY_ENDED');
const idleSince = session.paidAt && new Date(Math.max(session.paidAt.getTime(), session.lastActivityAt.getTime()));
if (idleSince && now >= addMinutes(idleSince, 30)) {
  return expire(session, 'IDLE_AFTER_PAID');
}
return session;
```

Use server time only. Any authenticated menu/scan/cart/order activity calls `touchShortcut`; scanning a new table changes only the scanning customer’s record. `leave` closes only caller’s shortcut. The cleanup cron is optional hygiene; `GET` and write endpoints must apply lazy expiry so correctness never depends on cron.

- [ ] **Step 4: Run tests and build**

Run: `npm test -- customer.service.spec.ts --runInBand && npm run build`

Expected: PASS, including same-table multi-customer isolation and midnight/30-minute expiry.

- [ ] **Step 5: Commit**

```bash
git add chalo-be/src/modules/customer chalo-be/src/app.module.ts
git commit -m "feat: add customer table shortcut APIs"
```

## Phase 2 — Đơn thuộc khách và ledger tích điểm

- [x] Task 4: Gắn đơn đăng nhập với shortcut đúng bàn

**Files:**
- Modify: `chalo-be/src/modules/order/order.controller.ts`
- Modify: `chalo-be/src/modules/order/order.service.ts`
- Modify: `chalo-be/src/modules/order/dto/create-order.dto.ts`
- Modify: `chalo-be/src/modules/order/order.module.ts`
- Test: `chalo-be/src/modules/order/order.service.customer.spec.ts`

**Interfaces:**
- `POST /api/order/create` vẫn public; nếu có bearer CUSTOMER hợp lệ và active shortcut khớp `dto.tableToken`, `Order.customerId` được gắn.
- Bearer bị thiếu, role staff/admin, token sai bàn hoặc shortcut hết hạn tạo đơn vãng lai (`customerId: null`) thay vì làm hỏng đặt món.

- [ ] **Step 1: Write failing tests**

```ts
it('gắn customerId khi customer có shortcut active đúng QR', async () => {
  const order = await service.create(dto, authenticatedCustomer);
  expect(order.customerId).toBe(authenticatedCustomer.id);
});

it('giữ đơn vãng lai khi không có bearer token', async () => {
  const order = await service.create(dto, null);
  expect(order.customerId).toBeNull();
});
```

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- order.service.customer.spec.ts --runInBand`

Expected: FAIL because create does not receive optional customer context.

- [ ] **Step 3: Implement optional JWT extraction and ownership check**

Add a non-throwing optional JWT helper/guard only for this public route. Pass `req.user?.id` to `OrderService.create`; query `CustomerService.getActiveShortcut` inside the order transaction boundary and set `customerId` only for a matching active shortcut. Keep current items/pricing/table lock untouched.

- [ ] **Step 4: Run order regression tests**

Run: `npm test -- order.service.customer.spec.ts order.service.status-transitions.spec.ts --runInBand`

Expected: PASS; existing QR orders still work with no auth header.

- [ ] **Step 5: Commit**

```bash
git add chalo-be/src/modules/order
git commit -m "feat: link authenticated customer orders"
```

- [x] Task 5: Idempotent point ledger on payment

**Files:**
- Modify: `chalo-be/src/modules/customer/customer.service.ts`
- Modify: `chalo-be/src/modules/order/order.service.ts`
- Test: `chalo-be/src/modules/order/order.service.loyalty.spec.ts`

**Interfaces:**
- `CustomerService.awardPointsForOrder(manager, order)` computes `Math.floor(order.totalAmount / 1000)` and uses unique `orderId` to be idempotent.
- Payment paths `paySingleOrder`, `payUnpaidOrdersByTable`, checkout complete/staff complete all invoke this method in their existing transaction.

- [x] **Step 1: Write failing payment tests**

```ts
it('awards 100 points for a paid 100,999 VND customer order', async () => {
  await service.paySingleOrder({ orderId: 'o1', tableToken: 'fixed-qr' });
  expect(await pointsFor(customer.id)).toBe(100);
});

it('does not double-award when the same paid order is retried', async () => {
  await service.paySingleOrder(payment);
  await service.paySingleOrder(payment);
  expect(await transactionsForOrder('o1')).toHaveLength(1);
});
```

- [x] **Step 2: Run tests to verify RED**

Run: `npm test -- order.service.loyalty.spec.ts --runInBand`

Expected: FAIL because no ledger write exists.

- [x] **Step 3: Implement ledger write within payment transactions**

```ts
const points = Math.floor(order.totalAmount / 1_000);
if (!order.customerId || points === 0) return;
await manager.getRepository(LoyaltyPointTransaction).upsert(
  { customerId: order.customerId, orderId: order.id, points, type: 'EARN' },
  ['orderId'],
);
```

Set `paidAt` only for the corresponding customer shortcut after that customer’s latest pending order is paid; never close all customers’ shortcuts because a table became available. Do not alter the stable QR behavior in `syncTableOccupancyAfterOrderChange`.

- [x] **Step 4: Run payment suite**

Run: `npm test -- order.service.loyalty.spec.ts order.service.status-transitions.spec.ts --runInBand && npm run build`

Expected: PASS for cash/QR/single/bulk/retry and no point on guest/cancelled/unpaid order.

- [x] **Step 5: Commit**

```bash
git add chalo-be/src/modules/customer/customer.service.ts chalo-be/src/modules/order/order.service.ts chalo-be/src/modules/order/*.spec.ts
git commit -m "feat: award loyalty points after payment"
```

## Phase 3 — Frontend login, mobile customer experience và shortcut landing

- [ ] Task 6: Google sign-in UI and secure callback exchange

**Files:**
- Create: `chalo-fe/src/app/(auth)/oauth/google/callback/page.tsx`
- Create: `chalo-fe/src/components/auth/GoogleSignInButton.tsx`
- Modify: `chalo-fe/src/app/(auth)/login/page.tsx`
- Modify: `chalo-fe/src/services/auth/auth.api.ts`
- Modify: `chalo-fe/src/constants/api-endpoints.ts`
- Modify: `chalo-fe/src/hooks/useLogin.ts`
- Test: `chalo-fe/src/services/auth/google-oauth.test.mts`
- Test: `chalo-fe/e2e/google-login.spec.ts`

**Interfaces:**
- `startGoogleLogin(returnTo: string): void` navigates to backend start URL with only a safe internal path.
- `exchangeGoogleCode(code: string): Promise<LoginResponse>` returns the same data consumed by `useAuthStore.setTokens/setUser`.

- [ ] **Step 1: Write failing frontend/API tests**

```ts
test('only permits internal return paths for Google start', () => {
  assert.equal(toSafeReturnPath('https://evil.example'), '/account');
});
```

```ts
test('Google callback exchanges a code then stores the normal login response', async ({ page }) => {
  await page.goto('/oauth/google/callback?code=one-time');
  await expect(page).toHaveURL(/\/account$/);
});
```

- [ ] **Step 2: Run tests to verify RED**

Run: `pnpm test:unit && pnpm exec playwright test e2e/google-login.spec.ts --project=chromium`

Expected: callback test fails because route/button/API are absent.

- [ ] **Step 3: Implement button and callback**

Use a recognizable Google mark rendered inline (no remote icon dependency), accessible label “Tiếp tục với Google”, loading/disabled state and a concise configuration error. Callback consumes code once, updates auth store through existing setters, removes code from browser history and routes CUSTOMER to `/account`; staff/admin role returned by the backend uses existing safe role routing.

- [ ] **Step 4: Run test and browser verification**

Run: `pnpm test:unit && pnpm exec tsc --noEmit && PLAYWRIGHT_BASE_URL=http://localhost:<port> pnpm exec playwright test e2e/google-login.spec.ts --project=chromium`

Expected: callback exchange works with mock backend, invalid/missing code has a recovery link, no token appears in URL or console.

- [ ] **Step 5: Commit**

```bash
git add chalo-fe/src/app/'(auth)' chalo-fe/src/components/auth chalo-fe/src/services/auth chalo-fe/src/constants/api-endpoints.ts chalo-fe/e2e/google-login.spec.ts
git commit -m "feat: add Google sign-in for customers"
```

- [ ] Task 7: Customer account, scan bàn và loyalty view mobile-first

**Files:**
- Create: `chalo-fe/src/services/customer/customer.api.ts`
- Create: `chalo-fe/src/services/customer/customer.types.ts`
- Create: `chalo-fe/src/services/customer/customer.queries.ts`
- Create: `chalo-fe/src/app/(customer)/account/page.tsx`
- Create: `chalo-fe/src/app/(customer)/account/_components/AccountShortcutCard.tsx`
- Create: `chalo-fe/src/app/(customer)/account/_components/LoyaltyBalanceCard.tsx`
- Create: `chalo-fe/src/app/(customer)/account/_components/TableQrScanner.tsx`
- Modify: `chalo-fe/src/constants/routes.ts`
- Test: `chalo-fe/e2e/customer-account.spec.ts`

**Interfaces:**
- `useCustomerProfile`, `useCustomerShortcut`, `useScanTable`, `useLeaveTable`, `useCustomerLoyalty`, `useCustomerOrders`.
- Account page renders current point balance, recent orders, scanning/manual QR entry, logout and server-confirmed “Tiếp tục gọi món”.

- [ ] **Step 1: Write failing mobile E2E scenarios**

```ts
test('customer sees points and can continue only their active shortcut', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: 'Tài khoản của bạn' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tiếp tục gọi món' })).toHaveAttribute('href', '/menu/fixed-qr');
});

test('manual QR token opens menu without asking whether the group is old or new', async ({ page }) => {
  await page.getByLabel('Mã bàn hoặc liên kết QR').fill('fixed-qr');
  await page.getByRole('button', { name: 'Vào bàn' }).click();
  await expect(page).toHaveURL('/menu/fixed-qr');
});
```

- [ ] **Step 2: Run E2E to verify RED**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:<port> pnpm exec playwright test e2e/customer-account.spec.ts --project=chromium`

Expected: FAIL because account route/components do not exist.

- [ ] **Step 3: Implement API layer and page**

Build scan UI using `BarcodeDetector` only when supported, with typed manual link/token fallback. Parse a same-origin `/menu/<token>` URL or a plain token; reject foreign/invalid URLs before API. Make “Quét mã bàn” the primary full-width action, show balance prominently, then shortcut/orders. Use explicit empty/error/loading states. `Leave table` removes only caller’s shortcut and `logout` uses existing auth flow.

- [ ] **Step 4: Verify mobile UI manually in browser and with Playwright**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:<port> pnpm exec playwright test e2e/customer-account.spec.ts --project=chromium`

Expected: 390×844 has no horizontal scroll, every primary target is visible/tappable, scan fallback works, and no client console errors.

- [ ] **Step 5: Commit**

```bash
git add chalo-fe/src/services/customer chalo-fe/src/app/'(customer)'/account chalo-fe/src/constants/routes.ts chalo-fe/e2e/customer-account.spec.ts
git commit -m "feat: add mobile customer account and table scan"
```

- [ ] Task 8: Landing shortcut and customer QR-menu integration

**Files:**
- Modify: `chalo-fe/src/app/_components/PublicLanding.tsx`
- Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/CustomerMenuClient.tsx`
- Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/page.tsx`
- Modify: `chalo-fe/src/services/order/order.api.ts`
- Modify: `chalo-fe/src/services/order/order.queries.ts`
- Modify: `chalo-fe/src/stores/cart.store.ts`
- Test: `chalo-fe/e2e/public-landing.spec.ts`
- Test: `chalo-fe/e2e/customer-menu-shortcut.spec.ts`

**Interfaces:**
- Landing calls `useCustomerShortcut` only after auth hydration; it shows cart/shortcut only when API returns active shortcut.
- `CustomerMenuClient` turns `CH` logo into a link to `/` and touches/scans server shortcut for an authenticated customer without blocking guests.

- [ ] **Step 1: Write failing UI tests**

```ts
test('landing shows a cart shortcut only for server-active table shortcut', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Tiếp tục gọi món' })).toHaveAttribute('href', '/menu/fixed-qr');
  await expect(page.getByLabel('Giỏ hàng, 2 món')).toBeVisible();
});

test('customer menu logo returns to landing without changing local cart', async ({ page }) => {
  await page.goto('/menu/fixed-qr');
  await page.getByRole('link', { name: 'Chalo Coffee - Trang chủ' }).click();
  await expect(page).toHaveURL('/');
});
```

- [ ] **Step 2: Run E2E to verify RED**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:<port> pnpm exec playwright test e2e/public-landing.spec.ts e2e/customer-menu-shortcut.spec.ts --project=chromium`

Expected: FAIL because shortcut UI/logo link are absent.

- [ ] **Step 3: Implement without changing cart isolation**

Keep `chalo-cart` per browser. Calculate badge only if `cart.tableToken === serverShortcut.tableToken`; otherwise show a shortcut without an item count or hide it per final visual fit. The logo is a semantic link with `aria-label`; guest menu calls no customer-only endpoint. Authenticated QR menu calls scan/touch asynchronously and never delays product rendering/order creation.

- [ ] **Step 4: Run UI verification**

Run: `pnpm test:unit && pnpm exec tsc --noEmit && PLAYWRIGHT_BASE_URL=http://localhost:<port> pnpm exec playwright test e2e/public-landing.spec.ts e2e/customer-menu-shortcut.spec.ts --project=chromium`

Expected: desktop/mobile green, no overflow/console errors, guest flow unchanged, two browsers still maintain distinct carts.

- [ ] **Step 5: Commit**

```bash
git add chalo-fe/src/app/_components/PublicLanding.tsx chalo-fe/src/app/'(customer)'/menu chalo-fe/src/services/order chalo-fe/src/stores/cart.store.ts chalo-fe/e2e
git commit -m "feat: add customer table shortcut to landing"
```

## Phase 4 — Vận hành, staff visibility và release

- [ ] Task 9: Staff/admin order context and production configuration guide

**Files:**
- Modify: `chalo-be/src/modules/order/order.service.ts`
- Modify: `chalo-fe/src/services/order/order.types.ts`
- Modify: `chalo-fe/src/app/(staff)/staff/orders/_components/OrderPaymentPanel.tsx`
- Modify: `chalo-fe/src/app/(admin)/admin/orders/**` (exact current order detail component after inspection)
- Create: `deploy/google-oauth.md`
- Modify: `chalo-be/.env.example` or `deploy/.env.production.example` (whichever exists after inspection)
- Test: `chalo-be/src/modules/order/order.service.loyalty.spec.ts`
- Test: `chalo-fe/e2e/staff-customer-loyalty.spec.ts`

**Interfaces:**
- Order DTO exposes only `customerDisplayName: string | null` and `loyaltyPointsEarned: number` to staff/admin; it never exposes customer email.
- Deployment guide defines exact authorized origins/redirect callback, required secrets and post-deploy health checks.

- [ ] **Step 1: Write failing staff visibility tests**

```ts
it('returns customer display name and earned points but no email in staff order DTO', () => {
  expect(dto).toMatchObject({ customerDisplayName: 'Châu', loyaltyPointsEarned: 100 });
  expect(dto).not.toHaveProperty('customerEmail');
});
```

```ts
test('staff payment view displays earned points without displaying customer email', async ({ page }) => {
  await expect(page.getByText('Cộng 100 điểm')).toBeVisible();
  await expect(page.getByText(/@gmail\.com/)).toHaveCount(0);
});
```

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- order.service.loyalty.spec.ts --runInBand` and `PLAYWRIGHT_BASE_URL=http://localhost:<port> pnpm exec playwright test e2e/staff-customer-loyalty.spec.ts --project=chromium`

Expected: visibility assertions fail until DTO/UI are added.

- [ ] **Step 3: Implement minimal operational UI and guide**

Extend order response join safely with customer display name and ledger points. Display a compact, optional line in payment/order details. Write `deploy/google-oauth.md` with Google Cloud consent screen, `https://chalocoffee.com` origin, exact callback (`https://<api-host>/api/auth/google/callback`), environment variable names, secret handling, migration command and rollback notes. Do not put actual client secret in any repository file.

- [ ] **Step 4: Run full verification**

Run:

```bash
cd chalo-be && npm test -- --runInBand && npm run build
cd ../chalo-fe && pnpm test:unit && pnpm exec tsc --noEmit && pnpm build
PLAYWRIGHT_BASE_URL=http://localhost:<port> pnpm exec playwright test --project=chromium
```

Expected: all relevant tests pass; existing lint failures outside scope are documented separately rather than hidden.

- [ ] **Step 5: Commit**

```bash
git add chalo-be/src/modules/order chalo-fe/src/services/order chalo-fe/src/app/'(staff)' chalo-fe/src/app/'(admin)' deploy
git commit -m "feat: show customer loyalty context to staff"
```

- [ ] Task 10: Pre-production acceptance and merge

**Files:**
- Modify: `docs/superpowers/plans/2026-08-12-customer-google-loyalty.md` (tick all completed tasks)
- Create: `docs/superpowers/summaries/2026-08-12-customer-google-loyalty-summary.md`

**Interfaces:**
- Produces an implementation summary linked to this plan/spec and a clean feature branch ready for merge.

- [ ] **Step 1: Run production-like acceptance checklist**

Verify with a real Google test account in the configured staging/production callback environment:

```text
Google login → CUSTOMER account → scan fixed printed QR → create order → staff pays → floor(VND/1000) points appear → landing shortcut expires after simulated 30 minutes → QR still resolves.
```

Verify admin promotion: change the Google-created account role through current staff page, refresh/sign in, and confirm correct staff/admin route.

- [ ] **Step 2: Inspect migrations and configuration before deploy**

Run: `npm run typeorm -- migration:run -d src/data-source.ts` in a disposable/staging database, then `npm run typeorm -- migration:revert -d src/data-source.ts`; inspect that existing `tables.qrToken` rows are unchanged.

Expected: migration round trip succeeds and no QR is rotated by payment tests.

- [ ] **Step 3: Document actual result**

Write the required four-section summary (Đã làm gì, File chính, Khác với plan, Còn dở / cần lưu ý), link it at the top to the spec and this plan, and update every completed top-level task checkbox.

- [ ] **Step 4: Finish branch with verified tests**

Use `finishing-a-development-branch`; inspect diff, merge only after user-approved release scope, then push `main` to trigger VPS deployment.

## Kết quả

Khi hoàn thành, ghi kết quả tại [2026-08-12-customer-google-loyalty-summary.md](../summaries/2026-08-12-customer-google-loyalty-summary.md).
