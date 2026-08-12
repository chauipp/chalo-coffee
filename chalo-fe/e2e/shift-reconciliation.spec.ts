import { expect, test } from "@playwright/test";

const ok = (data: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ code: 200, message: "success", data }) });
const staff = { id: 2, username: "staff", fullName: "Nhân viên", avatar: null, role: "MODERATOR", permissions: [] };
const report = { from: "2026-08-12T00:00:00.000Z", to: "2026-08-12T12:00:00.000Z", shift: null, summary: { cash: 120000, bankTransfer: 80000, customerConfirmation: 0, legacy: 0, paidOrders: 2, paidRevenue: 200000, averageOrderValue: 100000, unpaidOrders: 1, cancelledOrders: 0 }, transactions: [{ id: "p1", method: "CASH", source: "STAFF", totalAmount: 120000, paidAt: "2026-08-12T08:00:00.000Z", receivedAmount: 150000, changeAmount: 30000 }] };

async function stub(page: import("@playwright/test").Page) {
  let current: any = null;
  await page.route("**/api/auth/login", (route) => route.fulfill(ok({ accessToken: "token", refreshToken: "refresh", user: staff })));
  await page.route("**/api/auth/me", (route) => route.fulfill(ok(staff)));
  await page.route("**/api/shift/current", (route) => route.fulfill(ok(current)));
  await page.route("**/api/shift/report**", (route) => route.fulfill(ok({ ...report, shift: current })));
  await page.route("**/api/shift/open", async (route) => { current = { id: "shift-1", status: "OPEN", openingCash: route.request().postDataJSON().openingCash, openedAt: "2026-08-12T08:00:00.000Z", countedCash: null, expectedCash: null, variance: null, closedAt: null, note: null }; await route.fulfill(ok(current)); });
  await page.route("**/api/shift/current/close", async (route) => { current = null; await route.fulfill(ok({})); });
}

test("staff opens a cash shift then needs a note to close with variance", async ({ page }) => {
  await stub(page); await page.goto("/login"); await page.locator("#username").fill("staff"); await page.locator("#password").fill("123"); await page.getByRole("button", { name: "Đăng nhập" }).click(); await page.goto("/staff/shift");
  await expect(page.getByRole("heading", { name: "Chốt ca & đối soát" })).toBeVisible();
  await page.getByLabel("Tiền đầu ca").fill("50000"); await page.getByRole("button", { name: "Mở ca" }).click(); await expect(page.getByText("Ca đang mở")).toBeVisible();
  await page.getByLabel("Tiền thực đếm").fill("100000"); await expect(page.getByRole("button", { name: "Chốt ca" })).toBeDisabled();
  await page.getByLabel("Ghi chú chốt ca").fill("Kiểm lại quỹ"); await expect(page.getByRole("button", { name: "Chốt ca" })).toBeEnabled();
});

test("shift workspace remains usable at mobile width and provides CSV", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 }); await stub(page); await page.goto("/login"); await page.locator("#username").fill("staff"); await page.locator("#password").fill("123"); await page.getByRole("button", { name: "Đăng nhập" }).click(); await page.goto("/staff/shift");
  await expect(page.getByRole("button", { name: "Tải CSV" })).toBeVisible();
  const box = await page.getByRole("heading", { name: "Chốt ca & đối soát" }).boundingBox(); expect(box).not.toBeNull(); expect(box!.x + box!.width).toBeLessThanOrEqual(375);
});
