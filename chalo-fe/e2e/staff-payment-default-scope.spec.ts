import { expect, test, type Page } from "@playwright/test";

const ok = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ code: 200, message: "success", data }),
});

const order = {
  id: "order-10",
  tableId: "table-10",
  tableName: "Bàn 10",
  tableToken: "qr-table-10",
  status: "COMPLETED",
  paidStatus: false,
  items: [],
  totalAmount: 29_000,
  estimateWaitMinutes: null,
  note: null,
  createdAt: "2026-08-14T13:00:00.000Z",
  updatedAt: "2026-08-14T13:00:00.000Z",
};

async function stubStaffApi(page: Page) {
  const user = { id: 2, username: "staff", fullName: "Nhân viên", avatar: null, role: "MODERATOR", permissions: ["order:read", "order:write"] };
  await page.route("**/api/auth/login", (route) => route.fulfill(ok({ accessToken: "staff-token", refreshToken: "staff-refresh", user })));
  await page.route("**/api/auth/me", (route) => route.fulfill(ok(user)));
  await page.route("**/api/order/active", (route) => route.fulfill(ok([order])));
  await page.route("**/api/order/detail**", (route) => route.fulfill(ok(order)));
  await page.route("**/api/order/by-token/qr-table-10", (route) => route.fulfill(ok([order])));
  await page.route("**/api/order/checkout/preview**", (route) => route.fulfill(ok({ tableName: "Bàn 10", tableToken: order.tableToken, orders: [order], totalAmount: order.totalAmount })));
  await page.route("**/api/pager/list**", (route) => route.fulfill(ok([])));
  await page.route("**/api/settings", (route) => route.fulfill(ok({ waitTimeEnabled: true, baristaCount: 1, bankBin: null, bankAccountNo: null, bankAccountName: null })));
  await page.route("**/api/order/events**", (route) => route.fulfill({ status: 200, contentType: "text/event-stream", body: ": connected\n\n" }));
}

test("mở thanh toán từ chi tiết đơn sẽ mặc định chọn cả bàn", async ({ page }) => {
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(`${message.text()} ${message.location().url}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });
  await stubStaffApi(page);
  await page.goto("/login");
  await page.locator("#username").fill("staff");
  await page.locator("#password").fill("123456");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/staff/**");
  await page.goto("/staff/orders");
  await page.locator('div[role="button"]', { hasText: "Bàn 10" }).click();
  await page.getByRole("button", { name: "💵 Thanh toán" }).click();
  await expect(page.getByRole("heading", { name: "Thanh toán" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Cả bàn" })).toHaveAttribute("aria-checked", "true");
  await page.screenshot({ path: "/tmp/staff-payment-default-scope.png", fullPage: false });
  await page.getByRole("radio", { name: "Đơn này" }).click();
  await expect(page.getByRole("radio", { name: "Đơn này" })).toHaveAttribute("aria-checked", "true");
  expect(consoleErrors).toEqual([]);
  expect(failedResponses).toEqual([]);
});
