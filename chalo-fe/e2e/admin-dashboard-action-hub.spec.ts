import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const ok = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ code: 200, message: "success", data }),
});

async function restoreAdminSession(context: BrowserContext, baseURL: string) {
  await context.addCookies([
    { name: "chalo_access", value: "admin-session", url: baseURL, httpOnly: true, sameSite: "Strict", expires: Math.floor(Date.now() / 1_000) + 900 },
    { name: "chalo_role", value: "ADMIN", url: baseURL, sameSite: "Strict", expires: Math.floor(Date.now() / 1_000) + 7 * 86400 },
  ]);
  await context.addInitScript(() => localStorage.setItem("chalo-auth", JSON.stringify({ state: { user: { id: "admin-dashboard", username: "admin", fullName: "Quản trị", avatar: null, role: "ADMIN", permission: [] } }, version: 0 })));
}

async function mockDashboardApis(page: Page, shift = { id: "shift-1", status: "OPEN", openingCash: 100_000, openedAt: "2026-08-17T01:30:00.000Z", countedCash: null, expectedCash: null, variance: null, closedAt: null, note: null }, mockShift = true) {
  await page.route("**/api/auth/me", (route) => route.fulfill(ok({ id: "admin-dashboard", username: "admin", fullName: "Quản trị", avatar: null, role: "ADMIN", permission: [] })));
  await page.route("**/api/order/active", (route) => route.fulfill(ok([
    { id: "order-1", paymentRequested: true },
    { id: "order-2", paymentRequested: false },
    { id: "order-3", paymentRequested: false },
  ])));
  if (mockShift) {
    await page.route("**/api/shift/current", (route) => route.fulfill(ok(shift)));
  }
  await page.route("**/api/inventory/low-stock", (route) => route.fulfill(ok([
    { id: "coffee", name: "Hạt Arabica", unit: "g", onHand: 0, reorderLevel: 500, isActive: true, createdAt: "2026-08-17T00:00:00.000Z", updatedAt: "2026-08-17T00:00:00.000Z" },
  ])));
  await page.route("**/api/order/stats/revenue*", (route) => route.fulfill(ok({ totalRevenue: 1_000_000, totalOrders: 12, data: [] })));
  await page.route("**/api/order/stats/top-products*", (route) => route.fulfill(ok([])));
}

function collectFailures(page: Page) {
  const consoleErrors: string[] = [];
  const badResponses: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("response", (response) => { if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`); });
  return { consoleErrors, badResponses };
}

test("admin thấy các hành động vận hành nhanh trên desktop và mobile", async ({ page, context, baseURL }) => {
  const failures = collectFailures(page);
  await restoreAdminSession(context, baseURL!);
  await mockDashboardApis(page);
  await page.goto("/admin/dashboard");

  await expect(page.getByRole("heading", { name: "Cần xử lý" })).toBeVisible();
  await expect(page.getByRole("link", { name: /3 đơn đang xử lý/ })).toHaveAttribute("href", "/admin/orders");
  await expect(page.getByRole("link", { name: /Ca đang mở/ })).toHaveAttribute("href", "/admin/shift");
  await expect(page.getByRole("link", { name: /1 nguyên liệu cần nhập/ })).toHaveAttribute("href", "/admin/inventory");

  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page.locator("body").evaluate((body) => body.scrollWidth <= body.clientWidth)).resolves.toBe(true);
  expect(failures.consoleErrors).toEqual([]);
  expect(failures.badResponses).toEqual([]);
});

test("lỗi tải ca chỉ ảnh hưởng thẻ ca và tải lại được", async ({ page, context, baseURL }) => {
  await restoreAdminSession(context, baseURL!);
  await mockDashboardApis(page, undefined, false);
  let currentRequests = 0;
  let allowShiftResponse = false;
  await page.route("**/api/shift/current", async (route) => {
    currentRequests += 1;
    if (!allowShiftResponse) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ code: 503, message: "unavailable", data: null }) });
      return;
    }
    await route.fulfill(ok(null));
  });

  await page.goto("/admin/dashboard");
  const shiftCard = page.locator("article", { has: page.getByText("Ca làm việc", { exact: true }) });
  await expect(shiftCard.getByText("Chưa tải được dữ liệu.")).toBeVisible({ timeout: 12_000 });
  allowShiftResponse = true;
  await shiftCard.getByRole("button", { name: "Thử lại" }).click();
  await expect(shiftCard.getByRole("link", { name: /Chưa mở ca/ })).toBeVisible();
  expect(currentRequests).toBeGreaterThanOrEqual(3);
});
