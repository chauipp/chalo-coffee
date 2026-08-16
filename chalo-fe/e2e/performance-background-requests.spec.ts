import { expect, test, type Page } from "@playwright/test";

const ok = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ code: 200, message: "success", data }),
});

const staff = {
  id: "staff-1",
  username: "staff",
  fullName: "Nhân viên",
  avatar: null,
  role: "MODERATOR",
  permissions: ["order:read"],
};

const admin = { ...staff, id: "admin-1", username: "admin", role: "ADMIN" };

const order = {
  id: "order-1",
  tableId: "table-1",
  tableName: "Bàn 1",
  tableToken: "table-token-1",
  status: "PENDING",
  paidStatus: false,
  items: [],
  totalAmount: 42_000,
  createdAt: "2026-08-16T08:00:00.000Z",
  updatedAt: "2026-08-16T08:00:00.000Z",
};

async function stubCommonApi(page: Page) {
  await page.route("**/api/auth/login", (route) =>
    route.fulfill(ok({ accessToken: "test-token", refreshToken: "test-refresh", user: route.request().postData()?.includes("admin") ? admin : staff })),
  );
  await page.route("**/api/auth/me", (route) => route.fulfill(ok(staff)));
  await page.route("**/api/menu/category/simple-list", (route) => route.fulfill(ok([])));
  await page.route("**/api/menu/product/page**", (route) => route.fulfill(ok({ list: [], total: 0 })));
  await page.route("**/api/table/list", (route) => route.fulfill(ok([])));
  await page.route("**/api/order/page**", (route) => route.fulfill(ok({ list: [order], total: 1 })));
  await page.route("**/api/order/stats/revenue**", (route) => route.fulfill(ok({ totalRevenue: 0 })));
  await page.route("**/api/order/stats/top-products**", (route) => route.fulfill(ok([])));
}

async function login(page: Page, username: "staff" | "admin") {
  await page.goto("/login");
  await page.locator("#username").fill(username);
  await page.locator("#password").fill("password");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL(username === "admin" ? "**/admin/**" : "**/staff/**");
}

test("POS only fetches pager data while the pager board is open", async ({ page }) => {
  let pagerRequests = 0;
  await stubCommonApi(page);
  await page.route("**/api/order/active", (route) => route.fulfill(ok([order])));
  await page.route("**/api/pager/list**", (route) => {
    pagerRequests += 1;
    return route.fulfill(ok([]));
  });

  await login(page, "staff");
  await page.goto("/staff/pos");
  await page.waitForTimeout(16_000);
  expect(pagerRequests).toBe(0);

  await page.getByRole("button", { name: /Thẻ bàn/ }).click();
  await expect.poll(() => pagerRequests).toBeGreaterThan(0);
});

test("mobile POS does not mount the desktop prep dock", async ({ page }) => {
  let activeOrderRequests = 0;
  await page.setViewportSize({ width: 375, height: 667 });
  await stubCommonApi(page);
  await page.route("**/api/order/active", (route) => {
    activeOrderRequests += 1;
    return route.fulfill(ok([order]));
  });

  await login(page, "staff");
  await page.waitForTimeout(300);
  activeOrderRequests = 0;
  await page.goto("/staff/pos");
  await page.waitForTimeout(500);
  expect(activeOrderRequests).toBe(0);
  await expect(page.getByRole("button", { name: /Giỏ hàng/ })).toBeVisible();
});

test("admin history does not start operations fetch/SSE", async ({ page }) => {
  let activeOrderRequests = 0;
  let eventRequests = 0;
  await stubCommonApi(page);
  await page.route("**/api/order/active", (route) => {
    activeOrderRequests += 1;
    return route.fulfill(ok([order]));
  });
  await page.route("**/api/order/events**", (route) => {
    eventRequests += 1;
    return route.fulfill({ status: 200, contentType: "text/event-stream", body: ": connected\n\n" });
  });

  await login(page, "admin");
  await page.goto("/admin/orders?view=history");
  const dateFilter = page.locator('input[type="date"]');
  await expect(dateFilter).toBeVisible();
  await dateFilter.fill("2026-08-16");
  await page.waitForTimeout(500);
  expect(activeOrderRequests).toBe(0);
  expect(eventRequests).toBe(0);

});
