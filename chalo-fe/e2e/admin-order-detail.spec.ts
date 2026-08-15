import { expect, test } from "@playwright/test";

const order = { id: "order-admin-10", tableId: "table-10", tableName: "Bàn 10", tableToken: "qr-table-10", status: "COMPLETED", paidStatus: false, items: [], totalAmount: 29000, estimateWaitMinutes: null, note: null, createdAt: "2026-08-14T13:00:00.000Z", updatedAt: "2026-08-14T13:00:00.000Z" };
const ok = (data: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ code: 200, message: "success", data }) });

test("admin mở chi tiết đơn và thanh toán mặc định cả bàn", async ({ page }) => {
  const user = { id: 1, username: "admin", fullName: "Admin", role: "ADMIN", permissions: ["*"] };
  await page.route("**/api/auth/me", (route) => route.fulfill(ok(user)));
  await page.route("**/api/order/page**", (route) => route.fulfill(ok({ content: [order], totalElements: 1, totalPages: 1, pageNo: 1, pageSize: 20 })));
  await page.route("**/api/order/detail**", (route) => route.fulfill(ok(order)));
  await page.route("**/api/order/by-token/**", (route) => route.fulfill(ok([order])));
  await page.route("**/api/order/checkout/preview**", (route) => route.fulfill(ok({ orders: [order], totalAmount: order.totalAmount })));
  await page.route("**/api/settings", (route) => route.fulfill(ok({ bankBin: null, bankAccountNo: null, bankAccountName: null })));
  await page.goto("/admin/orders");
  await page.getByRole("button", { name: /order-ad/ }).click();
  await expect(page.getByRole("heading", { name: "Chi tiết đơn hàng" })).toBeVisible();
  await page.getByRole("button", { name: "💵 Thanh toán" }).click();
  await expect(page.getByRole("heading", { name: "Thanh toán" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Cả bàn" })).toHaveAttribute("aria-checked", "true");
});
