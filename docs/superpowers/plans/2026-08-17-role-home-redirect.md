# Role-aware home redirect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Người dùng có phiên hợp lệ mở `/` được chuyển tới màn mặc định của role; khách chưa đăng nhập vẫn thấy landing page.

**Architecture:** Bổ sung route gốc vào nhánh kiểm tra phiên của Next middleware. Middleware tiếp tục dùng `ROLE_DEFAULT_ROUTES` làm nguồn đích duy nhất, nên không cần đổi component landing hoặc client auth state. Test Playwright đặt cookie trước request đầu tiên để chứng minh redirect chạy ở middleware.

**Tech Stack:** Next.js middleware, TypeScript, Playwright.

## Global Constraints

- `ADMIN` → `/admin/dashboard`, `MODERATOR` → `/staff/orders`, `CUSTOMER` → `/account`.
- Không có `ACCESS_TOKEN` thì `/` tiếp tục hiển thị landing page.
- Token có role không ánh xạ được không được cấp quyền hay tự đổi hướng.
- Không đổi hành vi của link `/menu` hoặc các guard `/account`, `/staff/*`, `/admin/*`.
- UI phải được mở kiểm bằng Playwright ở desktop và viewport 375×667, gồm console và network.

---

- [ ] Task 1: Viết kiểm thử điều hướng trang chủ theo role

**Files:**

- Create: `chalo-fe/e2e/home-role-redirect.spec.ts`

**Interfaces:**

- Consumes: cookie `ACCESS_TOKEN`, `USER_ROLE` và đích từ `ROLE_DEFAULT_ROUTES`.
- Produces: regression coverage cho request đầu tiên tới `/` của ba role và trạng thái khách.

- [ ] **Step 1: Viết test redirect cho mọi role có phiên**

```ts
import { expect, test } from "@playwright/test";

const roleDestinations = [
  ["ADMIN", "/admin/dashboard"],
  ["MODERATOR", "/staff/orders"],
  ["CUSTOMER", "/account"],
] as const;

for (const [role, destination] of roleDestinations) {
  test(`${role} mở / được chuyển tới ${destination}`, async ({ context, page, baseURL }) => {
    await context.addCookies([
      { name: "ACCESS_TOKEN", value: `${role}-token`, url: baseURL },
      { name: "USER_ROLE", value: role, url: baseURL },
    ]);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(new RegExp(`${destination}$`));
  });
}
```

- [ ] **Step 2: Viết test giữ landing khi không có cookie xác thực**

```ts
test("khách chưa đăng nhập mở / vẫn thấy landing", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: /Một ly ngon/i })).toBeVisible();
});
```

- [ ] **Step 3: Chạy test để xác nhận lỗi trước khi sửa middleware**

Run: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:<port> pnpm exec playwright test e2e/home-role-redirect.spec.ts --project=chromium`

Expected: ba case role vẫn ở `/` và fail; case khách pass.

- [ ] **Step 4: Commit test đỏ**

```bash
git add chalo-fe/e2e/home-role-redirect.spec.ts
git commit -m "test: cover role-aware home redirect"
```

- [ ] Task 2: Chuyển hướng route gốc trong middleware

**Files:**

- Modify: `chalo-fe/middleware.ts:23-31`
- Test: `chalo-fe/e2e/home-role-redirect.spec.ts`

**Interfaces:**

- Consumes: `token`, `role`, `ROLE_DEFAULT_ROUTES` và `ROUTES.LOGIN` đã có trong `middleware`.
- Produces: `NextResponse.redirect()` trước khi Home server component render khi `/` có token và role hợp lệ.

- [ ] **Step 1: Thay điều kiện route công khai để bao gồm `/`**

```ts
const isPublicRoute = pathname === "/" || PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

if (isPublicRoute) {
  if (token && role) {
    const dest = ROLE_DEFAULT_ROUTES[role] ?? ROUTES.LOGIN;
    return NextResponse.redirect(new URL(dest, request.url));
  }
  return NextResponse.next();
}
```

- [ ] **Step 2: Chạy test mới để xác nhận pass**

Run: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:<port> pnpm exec playwright test e2e/home-role-redirect.spec.ts --project=chromium`

Expected: 4 passed.

- [ ] **Step 3: Chạy regression của guard customer**

Run: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:<port> pnpm exec playwright test e2e/customer-role-guard.spec.ts --project=chromium`

Expected: 2 passed.

- [ ] **Step 4: Kiểm UI theo luồng thật**

Run dev server, rồi mở `/` bằng Playwright với cookie của từng role ở desktop và 375×667. Xác nhận URL đích, snapshot có shell role tương ứng, console không có error và network không có HTTP 4xx/5xx ngoài SSE `http://localhost:8080/api/order/events` nếu chính endpoint đó không được mock.

- [ ] **Step 5: Commit implementation**

```bash
git add chalo-fe/middleware.ts chalo-fe/e2e/home-role-redirect.spec.ts
git commit -m "fix: redirect authenticated roles from home"
```

## Kết quả

Sẽ liên kết tới `../summaries/2026-08-17-role-home-redirect-summary.md` sau khi hoàn tất toàn bộ task.
