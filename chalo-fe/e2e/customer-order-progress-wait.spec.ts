import { expect, test, type Page } from "@playwright/test";

const tableToken = "progress-table";

const apiResponse = <T,>(data: T) => ({
  code: 200,
  message: "success",
  data,
});

function orderWithStatus(
  status: "PENDING" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED",
  estimateWaitMinutes: number | null = 8,
) {
  return {
    id: `order-${status.toLowerCase()}`,
    tableId: "table-1",
    tableName: "Bàn 01",
    tableToken,
    items: [
      {
        id: "item-1",
        productId: "product-1",
        productName: "Cà phê sữa đá",
        productImageUrl: null,
        price: 35_000,
        quantity: 1,
        preparedQuantity: 0,
        subtotal: 35_000,
        note: null,
      },
    ],
    status,
    paidStatus: false,
    totalAmount: 35_000,
    estimateWaitMinutes,
    note: null,
    createdAt: "2026-08-13T01:00:00.000Z",
    updatedAt: "2026-08-13T01:00:00.000Z",
  };
}

async function mockCustomerOrder(page: Page, tableToken: string, order: ReturnType<typeof orderWithStatus>) {
  await page.route(`**/api/order/by-token/${tableToken}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(apiResponse([order])),
    }),
  );
}

async function mockCustomerOrders(page: Page, orders: ReturnType<typeof orderWithStatus>[]) {
  await page.route(`**/api/order/by-token/${tableToken}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(apiResponse(orders)),
    }),
  );
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.EventSource = class {
      addEventListener() {}
      close() {}
      onerror: (() => void) | null = null;
      onopen: (() => void) | null = null;
    } as unknown as typeof EventSource;
  });
});

test("pending order marks receiving as the active service step", async ({ page }) => {
  const order = orderWithStatus("PENDING");
  await mockCustomerOrder(page, tableToken, order);

  await page.goto(`/menu/${tableToken}/orders/${order.id}`);

  await expect(page.getByText("Đang tiếp nhận", { exact: true })).toBeVisible();
  await expect(page.getByText("Đã pha chế", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Chờ dự kiến", { exact: true })).toBeVisible();
  await expect(page.getByText("~8 phút", { exact: true })).toBeVisible();
  await expect(page.getByText("Đang tiến hành", { exact: false })).toHaveCount(0);
  await expect(page.getByTestId("service-step-active")).toHaveText(/Đang tiếp nhận/);
});

test("orders list shows the estimate belonging to each active order only", async ({ page }) => {
  const pending = orderWithStatus("PENDING", 8);
  const preparing = { ...orderWithStatus("PREPARING", 3), id: "order-preparing" };
  const completed = { ...orderWithStatus("COMPLETED", 5), id: "order-completed" };
  const cancelled = { ...orderWithStatus("CANCELLED", 2), id: "order-cancelled" };
  const unknownWait = { ...orderWithStatus("PENDING", null), id: "order-null-wait" };
  await mockCustomerOrders(page, [pending, preparing, completed, cancelled, unknownWait]);

  await page.goto(`/menu/${tableToken}/orders`);

  await expect(page.getByText(/Chờ dự kiến: ~8 phút/)).toBeVisible();
  await expect(page.getByText(/Chờ dự kiến: ~3 phút/)).toBeVisible();
  await expect(page.getByText("Chờ dự kiến:", { exact: false })).toHaveCount(2);
});

test("service step labels distinguish completed work from the current work", async ({ page }) => {
  for (const [status, expectedLabels] of [
    ["PREPARING", ["Đã tiếp nhận", "Đang pha chế"]],
    ["READY", ["Đã pha chế", "Sẵn sàng phục vụ"]],
  ] as const) {
    const order = orderWithStatus(status);
    await mockCustomerOrder(page, tableToken, order);
    await page.goto(`/menu/${tableToken}/orders/${order.id}`);

    for (const label of expectedLabels) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(page.getByTestId("service-step-active")).toContainText(expectedLabels[1]);
    await page.unroute(`**/api/order/by-token/${tableToken}`);
  }
});

test("completed order shows every service step as completed", async ({ page }) => {
  const order = orderWithStatus("COMPLETED");
  await mockCustomerOrder(page, tableToken, order);

  await page.goto(`/menu/${tableToken}/orders/${order.id}`);

  await expect(page.getByText("Đã sẵn sàng phục vụ", { exact: true })).toBeVisible();
  await expect(page.getByText("Đã phục vụ", { exact: true })).toBeVisible();
  await expect(page.getByTestId("service-step-active")).toHaveCount(0);
  await expect(page.getByText("Chờ dự kiến:", { exact: false })).toHaveCount(0);
});
