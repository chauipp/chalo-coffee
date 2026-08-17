import { expect, test } from "@playwright/test";

const order = { id: "order-admin-10", tableId: "table-10", tableName: "Bàn 10", tableToken: "qr-table-10", status: "COMPLETED", paidStatus: false, items: [], totalAmount: 29000, estimateWaitMinutes: null, note: null, createdAt: "2026-08-14T13:00:00.000Z", updatedAt: "2026-08-14T13:00:00.000Z" };
const ok = (data: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ code: 200, message: "success", data }) });

async function restoreAdmin(context: import("@playwright/test").BrowserContext, baseURL: string) {
  await context.addCookies([
    { name: "chalo_access", value: "admin-session", url: baseURL, httpOnly: true, sameSite: "Strict", expires: Math.floor(Date.now() / 1000) + 900 },
    { name: "chalo_role", value: "ADMIN", url: baseURL, sameSite: "Strict", expires: Math.floor(Date.now() / 1000) + 7 * 86400 },
  ]);
  await context.addInitScript(() => localStorage.setItem("chalo-auth", JSON.stringify({ state: { user: { id: "1", username: "admin", fullName: "Admin", avatar: null, role: "ADMIN", permission: ["*"] } }, version: 0 })));
}

test("admin mở chi tiết đơn và thanh toán mặc định cả bàn", async ({ page, context, baseURL }) => {
  const user = { id: 1, username: "admin", fullName: "Admin", role: "ADMIN", permissions: ["*"] };
  await page.route("**/api/auth/me", (route) => route.fulfill(ok(user)));
  await page.route("**/api/order/page**", (route) => route.fulfill(ok({ list: [order], total: 1 })));
  await page.route("**/api/order/detail**", (route) => route.fulfill(ok(order)));
  await page.route("**/api/order/by-token/**", (route) => route.fulfill(ok([order])));
  await page.route("**/api/order/checkout/preview**", (route) => route.fulfill(ok({ orders: [order], totalAmount: order.totalAmount })));
  await page.route("**/api/settings", (route) => route.fulfill(ok({ bankBin: null, bankAccountNo: null, bankAccountName: null })));
  await restoreAdmin(context, baseURL!);
  await page.goto("/admin/orders");
  await page.getByRole("tab", { name: "Lịch sử" }).click();
  await page.getByRole("button", { name: /order-ad/ }).click();
  await expect(page.getByRole("heading", { name: "Chi tiết đơn hàng" })).toBeVisible();
  await page.getByRole("button", { name: "💵 Thanh toán" }).click();
  await expect(page.getByRole("heading", { name: "Thanh toán" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Cả bàn" })).toHaveAttribute("aria-checked", "true");
});

test("admin ghi nhận hoàn tiền có xác nhận", async ({ page, context, baseURL }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const paidOrder = { ...order, paidStatus: true, id: "order-refund-1" };
  const user = { id: 1, username: "admin", fullName: "Admin", role: "ADMIN", permission: ["*"] };
  const refunds = { paymentTransactionId: "payment-refund-1", totalAmount: 29_000, refundedAmount: 0, refundableAmount: 29_000, refunds: [] };
  const failures: string[] = [];
  const badResponses: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") failures.push(message.text()); });
  page.on("response", (response) => { if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`); });
  await page.route("**/api/auth/me", (route) => route.fulfill(ok(user)));
  await page.route("**/api/order/active", (route) => route.fulfill(ok([])));
  await page.route("**/api/order/checkout/preview", (route) => route.fulfill(ok({ orders: [paidOrder], totalAmount: paidOrder.totalAmount })));
  await page.route("**/api/table/list", (route) => route.fulfill(ok([])));
  await page.route("**/api/pager/list**", (route) => route.fulfill(ok([])));
  await page.route("**/api/order/stats/revenue**", (route) => route.fulfill(ok({ totalRevenue: 0, totalOrders: 0, data: [] })));
  await page.route("**/api/order/stats/top-products**", (route) => route.fulfill(ok([])));
  await page.addInitScript(() => {
    class FixtureEventSource {
      onopen: (() => void) | null = null;
      onerror: (() => void) | null = null;
      addEventListener() {}
      close() {}
    }
    window.EventSource = FixtureEventSource as unknown as typeof EventSource;
  });
  await page.route("**/api/order/page**", (route) => route.fulfill(ok({ list: [paidOrder], total: 1 })));
  await page.route("**/api/order/detail**", (route) => route.fulfill(ok(paidOrder)));
  await page.route("**/api/payment-transactions/by-order/order-refund-1/refunds", (route) => route.fulfill(ok(refunds)));
  await page.route("**/api/payment-transactions/payment-refund-1/refunds", (route) => route.fulfill(ok({ refund: { id: "refund-1", amount: 10_000, method: "CASH", reason: "Khách đổi ý" }, refundedAmount: 10_000, refundableAmount: 19_000 })));
  await restoreAdmin(context, baseURL!);
  await page.goto("/admin/orders");
  await page.getByRole("tab", { name: "Lịch sử" }).click();
  await page.getByRole("button", { name: /order-re/ }).click();
  await expect(page.getByTestId("refund-panel")).toContainText("còn có thể hoàn 29.000đ");
  await page.getByRole("button", { name: "Ghi nhận hoàn tiền" }).click();
  await page.getByLabel("Số tiền hoàn").fill("10000");
  await page.getByLabel("Lý do hoàn tiền").fill("Khách đổi ý");
  await page.getByRole("button", { name: "Tiếp tục xác nhận" }).click();
  await expect(page.getByRole("dialog", { name: "Xác nhận hoàn tiền" })).toBeVisible();
  await page.getByRole("dialog", { name: "Xác nhận hoàn tiền" }).getByRole("button", { name: "Xác nhận hoàn tiền" }).click();
  await expect(page.getByText("Đã ghi nhận hoàn tiền")).toBeVisible();
  await expect(page.locator("body").evaluate((body) => body.scrollWidth <= body.clientWidth)).resolves.toBe(true);
  expect(badResponses).toEqual([]);
  expect(failures).toEqual([]);
});
