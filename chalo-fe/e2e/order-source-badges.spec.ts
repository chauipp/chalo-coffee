import { expect, test, type Page } from "@playwright/test";
import type { OrderDto } from "../src/services/order/order.types";

const now = "2026-08-16T08:00:00.000Z";

const orders: OrderDto[] = [
  {
    id: "order-source-qr",
    tableId: "table-qr",
    tableName: "Bàn QR",
    tableToken: "token-qr",
    orderSource: "QR",
    status: "PENDING",
    paidStatus: false,
    items: [{ id: "item-qr", productId: "coffee", productName: "Cà phê QR", productImageUrl: null, price: 25000, quantity: 1, preparedQuantity: 0, subtotal: 25000, note: null }],
    totalAmount: 25000,
    estimateWaitMinutes: 5,
    note: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "order-source-pos",
    tableId: "table-pos",
    tableName: "Bàn quầy",
    tableToken: "token-pos",
    orderSource: "POS",
    pagerNumber: 12,
    status: "PENDING",
    paidStatus: true,
    items: [{ id: "item-pos", productId: "tea", productName: "Trà quầy", productImageUrl: null, price: 30000, quantity: 1, preparedQuantity: 0, subtotal: 30000, note: null }],
    totalAmount: 30000,
    estimateWaitMinutes: 5,
    note: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "order-source-na",
    tableId: "table-na",
    tableName: "Bàn lịch sử",
    tableToken: "token-na",
    orderSource: "N_A",
    status: "READY",
    paidStatus: false,
    items: [{ id: "item-na", productId: "milk", productName: "Bạc xỉu cũ", productImageUrl: null, price: 28000, quantity: 1, preparedQuantity: 0, subtotal: 28000, note: null }],
    totalAmount: 28000,
    estimateWaitMinutes: 5,
    note: null,
    createdAt: now,
    updatedAt: now,
  },
];

const prepOrders = orders.map((order) =>
  order.orderSource === "N_A" ? order : { ...order, status: "PREPARING" as const },
);
let activeOrders = orders;

const ok = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ code: 200, message: "success", data }),
});

const sourceBadge = (page: Page, label: string) =>
  page.locator(`span[aria-label="Nguồn đơn: ${label}"]:visible`);
const pagerBadge = (page: Page) => page.locator('span:text-is("Thẻ #12"):visible');

async function stubOrderFixtures(page: Page) {
  await page.route("**/api/auth/me", (route) =>
    route.fulfill(ok({ id: "1", username: "admin", fullName: "Admin", avatar: null, role: "ADMIN", permission: ["*"] })),
  );
  await page.route("**/api/order/active**", (route) => route.fulfill(ok(activeOrders)));
  await page.route("**/api/order/page**", (route) =>
    route.fulfill(ok({ list: orders, total: orders.length })),
  );
  await page.route("**/api/table/list", (route) => route.fulfill(ok([])));
  await page.route("**/api/order/events**", (route) =>
    route.fulfill({ status: 200, contentType: "text/event-stream", body: "" }),
  );
}

test.beforeEach(async ({ context, page }) => {
  activeOrders = orders;
  await context.addCookies([
    { name: "ACCESS_TOKEN", value: "test-admin-token", url: "http://127.0.0.1:3014" },
    { name: "USER_ROLE", value: "ADMIN", url: "http://127.0.0.1:3014" },
  ]);
  await page.addInitScript(() => {
    localStorage.setItem("chalo-auth", JSON.stringify({
      state: { accessToken: "test-admin-token", refreshToken: "test-refresh-token", user: null },
      version: 0,
    }));
  });
  await stubOrderFixtures(page);
});

test("admin board and prep dock preserve QR, POS/pager, and N/A meanings", async ({
  page,
}, testInfo) => {
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  await page.goto("/admin/orders");

  await expect(sourceBadge(page, "QR")).toBeVisible();
  await expect(sourceBadge(page, "Quầy")).toBeVisible();
  await expect(pagerBadge(page)).toBeVisible();
  await expect(sourceBadge(page, "N/A")).toBeVisible();

  activeOrders = prepOrders;
  await page.reload();
  await page.getByTestId("admin-prep-rail-action").click();
  const dock = page.locator("#admin-prep-dock");
  await expect(dock.getByRole("heading", { name: "Đang pha chế" })).toBeVisible();
  await dock.getByTestId("prep-mode-table").click();
  await expect(dock.getByTestId("prep-table-order-source-qr").locator('span[aria-label="Nguồn đơn: QR"]')).toBeVisible();
  await expect(dock.getByTestId("prep-table-order-source-pos").locator('span[aria-label="Nguồn đơn: Quầy"]')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("desktop-order-source-badges.png"), fullPage: true });

  activeOrders = orders;
  await page.setViewportSize({ width: 375, height: 667 });
  await page.reload();
  await expect(sourceBadge(page, "QR")).toBeVisible();
  await expect(sourceBadge(page, "Quầy")).toBeVisible();
  await expect(pagerBadge(page)).toBeVisible();
  await page.getByRole("button", { name: /Sẵn sàng phục vụ/ }).click();
  await expect(sourceBadge(page, "N/A")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("mobile-order-source-badges.png"), fullPage: true });
  expect(failedResponses).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
