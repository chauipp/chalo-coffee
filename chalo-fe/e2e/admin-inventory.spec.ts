import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const ok = (data: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ code: 200, message: "success", data }) });
const ingredients = [
  { id: "coffee", name: "Hạt Arabica", unit: "g", onHand: 480, reorderLevel: 500, isActive: true, createdAt: "2026-08-17T00:00:00.000Z", updatedAt: "2026-08-17T00:00:00.000Z" },
  { id: "milk", name: "Sữa đặc", unit: "ml", onHand: 0, reorderLevel: 250, isActive: true, createdAt: "2026-08-17T00:00:00.000Z", updatedAt: "2026-08-17T00:00:00.000Z" },
];

async function restoreAdminSession(context: BrowserContext, baseURL: string) {
  await context.addCookies([
    { name: "chalo_access", value: "admin-session", url: baseURL, httpOnly: true, sameSite: "Strict", expires: Math.floor(Date.now() / 1000) + 900 },
    { name: "chalo_role", value: "ADMIN", url: baseURL, sameSite: "Strict", expires: Math.floor(Date.now() / 1000) + 7 * 86400 },
  ]);
  await context.addInitScript(() => localStorage.setItem("chalo-auth", JSON.stringify({ state: { user: { id: "admin-inventory", username: "admin", fullName: "Quản trị", avatar: null, role: "ADMIN", permission: [] } }, version: 0 })));
}

function collectFailures(page: Page) {
  const consoleErrors: string[] = [];
  const badResponses: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("response", (response) => { if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`); });
  return { consoleErrors, badResponses };
}

async function mockInventory(page: Page, source = ingredients) {
  await page.route("**/api/inventory/ingredients", (route) => {
    if (route.request().method() === "POST") return route.fulfill(ok({ ...source[0], id: "new-ingredient" }));
    return route.fulfill(ok(source));
  });
  await page.route("**/api/inventory/low-stock", (route) => route.fulfill(ok(source.filter((item) => item.onHand <= item.reorderLevel))));
  await page.route("**/api/inventory/ingredients/*/movements", (route) => route.fulfill(ok([{ id: "move-1", ingredientId: "coffee", type: "RECEIPT", delta: 120, quantityBefore: 360, quantityAfter: 480, reason: "Nhập buổi sáng", orderId: null, createdAt: "2026-08-17T01:00:00.000Z" }])));
  await page.route("**/api/inventory/ingredients/*/receive", (route) => route.fulfill(ok(source[0])));
  await page.route("**/api/inventory/ingredients/*/adjust", (route) => route.fulfill(ok(source[0])));
}

test("admin quản lý tồn kho trên desktop, gồm lịch sử và kiểm tra form", async ({ page, context, baseURL }) => {
  const failures = collectFailures(page);
  await restoreAdminSession(context, baseURL!);
  await mockInventory(page);
  await page.goto("/admin/inventory");
  await expect(page.getByRole("heading", { name: "Tồn kho" })).toBeVisible();
  await expect(page.getByTestId("inventory-ingredient-coffee")).toContainText("Cần nhập");
  await expect(page.getByTestId("inventory-ingredient-milk")).toContainText("Đã hết");
  await page.getByRole("button", { name: "+ Thêm nguyên liệu" }).click();
  await page.getByTestId("inventory-add-modal").getByRole("button", { name: "Thêm nguyên liệu" }).click();
  await expect(page.getByText("Vui lòng nhập tên và đơn vị tính.")).toBeVisible();
  await page.getByLabel("Tên nguyên liệu").fill("Trà ô long");
  await page.getByLabel("Đơn vị").fill("g");
  await page.getByLabel("Mức cần nhập").fill("100");
  await page.getByLabel("Tồn đầu kỳ").fill("500");
  await page.getByTestId("inventory-add-modal").getByRole("button", { name: "Thêm nguyên liệu" }).click();
  await expect(page.getByTestId("inventory-add-modal")).toHaveCount(0);
  await page.getByTestId("inventory-ingredient-coffee").getByRole("button", { name: "Lịch sử" }).click();
  await expect(page.getByTestId("inventory-history")).toContainText("Nhập buổi sáng");
  await page.getByRole("dialog", { name: "Lịch sử tồn kho" }).getByRole("button", { name: "Đóng" }).click();
  expect(failures.consoleErrors).toEqual([]);
  expect(failures.badResponses).toEqual([]);
});

test("trang kho không tràn trên mobile và đi được từ mục Khác", async ({ page, context, baseURL }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const failures = collectFailures(page);
  await restoreAdminSession(context, baseURL!);
  await mockInventory(page, []);
  await page.goto("/admin/inventory");
  await page.getByRole("button", { name: "Khác" }).click();
  await expect(page.getByRole("link", { name: "Tồn kho" })).toBeVisible();
  await page.getByRole("link", { name: "Tồn kho" }).click();
  await expect(page.getByText("Chưa có nguyên liệu")).toBeVisible();
  await expect(page.locator("body").evaluate((body) => body.scrollWidth <= body.clientWidth)).resolves.toBe(true);
  expect(failures.consoleErrors).toEqual([]);
  expect(failures.badResponses).toEqual([]);
});

test("dashboard dẫn admin tới tồn kho khi có cảnh báo", async ({ page, context, baseURL }) => {
  const failures = collectFailures(page);
  await restoreAdminSession(context, baseURL!);
  await mockInventory(page);
  await page.route("**/api/order/stats/revenue*", (route) => route.fulfill(ok({ totalRevenue: 0, totalOrders: 0, data: [] })));
  await page.route("**/api/order/stats/top-products*", (route) => route.fulfill(ok([])));
  await page.goto("/admin/dashboard");
  const alert = page.getByRole("link", { name: /nguyên liệu.*Xem tồn kho/ });
  await expect(alert).toBeVisible();
  await alert.click();
  await expect(page).toHaveURL(/\/admin\/inventory$/);
  expect(failures.consoleErrors).toEqual([]);
  expect(failures.badResponses).toEqual([]);
});
