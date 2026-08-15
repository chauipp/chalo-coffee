import { expect, test, type Page } from "@playwright/test";
import type { OrderDto } from "../src/services/order/order.types";

const ok = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ code: 200, message: "success", data }),
});

const staff = {
  id: 2,
  username: "staff",
  fullName: "Nhân viên",
  avatar: null,
  role: "MODERATOR",
  permissions: ["order:read", "order:write"],
};

const order: OrderDto = {
  id: "order-01",
  tableId: "table-01",
  tableName: "Bàn 01",
  tableToken: "qr-table-01",
  orderSource: "N_A",
  status: "COMPLETED",
  paidStatus: false,
  items: [
    {
      id: "item-01",
      productId: "product-01",
      productName: "Cà phê sữa",
      productImageUrl: null,
      price: 120_000,
      quantity: 1,
      preparedQuantity: 1,
      subtotal: 120_000,
      note: null,
    },
  ],
  totalAmount: 120_000,
  estimateWaitMinutes: null,
  note: null,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

const tableOrder: OrderDto = {
  ...order,
  id: "order-02",
  totalAmount: 85_000,
  items: [{ ...order.items[0], id: "item-02", subtotal: 85_000 }],
};

async function stubOrderApi(
  page: Page,
  onPay: (body: unknown) => void,
  onPayAll: (body: unknown) => void,
) {
  await page.route("**/api/auth/login", (route) =>
    route.fulfill(ok({ accessToken: "staff-token", refreshToken: "staff-refresh", user: staff })),
  );
  await page.route("**/api/auth/me", (route) => route.fulfill(ok(staff)));
  await page.route("**/api/pager/list**", (route) => route.fulfill(ok([])));
  await page.route("**/api/order/active", (route) => route.fulfill(ok([order])));
  await page.route("**/api/order/detail**", (route) => route.fulfill(ok(order)));
  await page.route("**/api/order/checkout/preview", (route) =>
    route.fulfill(ok({
      tableId: order.tableId,
      tableName: order.tableName,
      tableToken: order.tableToken,
      orderIds: [order.id, tableOrder.id],
      totalAmount: 205_000,
      orders: [order, tableOrder],
    })),
  );
  await page.route("**/api/settings", (route) =>
    route.fulfill(ok({
      waitTimeEnabled: true,
      baristaCount: 1,
      bankBin: "970422",
      bankAccountNo: "0123456789",
      bankAccountName: "CHALO COFFEE",
    })),
  );
  await page.route("**/api/order/pay", async (route) => {
    onPay(route.request().postDataJSON());
    await route.fulfill(ok({ ...order, paidStatus: true }));
  });
  await page.route("**/api/order/pay-all", async (route) => {
    onPayAll(route.request().postDataJSON());
    await route.fulfill(ok([{ ...order, paidStatus: true }, { ...tableOrder, paidStatus: true }]));
  });
}

async function openOrderDetail(page: Page) {
  await page.goto("/login");
  await page.locator("#username").fill("staff");
  await page.locator("#password").fill("123456");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/staff/**");
  await page.goto("/staff/orders");
  await page.locator('div[role="button"]:visible', { hasText: "Bàn 01" }).click();
  await expect(page.getByRole("heading", { name: "Chi tiết đơn hàng" })).toBeVisible();
  await page.getByRole("button", { name: "💵 Thanh toán" }).click();
}

test("mặc định thanh toán một đơn bằng tiền mặt và tính tiền thừa", async ({ page }) => {
  let payBody: unknown = null;
  let payAllBody: unknown = null;
  await stubOrderApi(page, (body) => (payBody = body), (body) => (payAllBody = body));

  await openOrderDetail(page);
  await expect(page.getByRole("radio", { name: "Đơn này" })).toBeChecked();
  await page.getByRole("radio", { name: /Tiền mặt/ }).click();
  await page.getByRole("textbox", { name: "Tiền khách đưa" }).fill("150000");
  await expect(page.getByText("30.000đ")).toBeVisible();
  await page.getByRole("button", { name: "Xác nhận đã thanh toán" }).click();

  expect(payBody).toEqual({ orderId: order.id, tableToken: order.tableToken, method: "CASH", receivedAmount: 150_000 });
  expect(payAllBody).toBeNull();
});

test("có thể đổi sang cả bàn và thanh toán QR theo tổng gộp", async ({ page }) => {
  let payBody: unknown = null;
  let payAllBody: unknown = null;
  await stubOrderApi(page, (body) => (payBody = body), (body) => (payAllBody = body));

  await openOrderDetail(page);
  await page.getByRole("radio", { name: "Cả bàn" }).click();
  await expect(page.getByText("205.000đ")).toBeVisible();
  await expect(page.getByTestId("vietqr-code")).toBeVisible();
  await page.getByRole("button", { name: "Xác nhận đã thanh toán" }).click();

  expect(payBody).toBeNull();
  expect(payAllBody).toEqual({ tableToken: order.tableToken, method: "BANK_TRANSFER" });
});

test("bước thanh toán vẫn vừa màn hình mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await stubOrderApi(page, () => {}, () => {});

  await page.goto("/login");
  await page.locator("#username").fill("staff");
  await page.locator("#password").fill("123456");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/staff/**");
  await page.goto("/staff/orders");
  await page.getByRole("button", { name: /Đã phục vụ/ }).click();
  await page.locator('div[role="button"]:visible', { hasText: "Bàn 01" }).click();
  await expect(page.getByRole("heading", { name: "Chi tiết đơn hàng" })).toBeVisible();
  await page.getByRole("button", { name: "💵 Thanh toán" }).click();
  await expect(page.getByRole("radio", { name: "Đơn này" })).toBeChecked();
  await page.getByRole("radio", { name: /Tiền mặt/ }).click();

  const modal = page.getByRole("heading", { name: "Thanh toán" }).locator("xpath=../..");
  await expect(modal).toBeVisible();
  const box = await modal.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(375);
  await expect(page.getByRole("textbox", { name: "Tiền khách đưa" })).toBeVisible();
});
