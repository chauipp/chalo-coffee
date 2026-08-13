import { expect, test, type Page } from "@playwright/test";

const BE = "http://localhost:8080/api";

const apiResponse = <T,>(data: T) => ({
  code: 200,
  message: "success",
  data,
});

async function getTableToken(request: import("@playwright/test").APIRequestContext) {
  const login = await request.post(`${BE}/auth/login`, {
    data: { username: "admin", password: "admin" },
  });
  const adminToken = (await login.json()).data.accessToken;
  const tablesResponse = await request.get(`${BE}/table/list`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const tables = (await tablesResponse.json()).data as Array<{
    qrToken: string;
    activeOrders: Array<{ id: string }>;
  }>;
  return tables.find((table) => table.activeOrders.length === 0)?.qrToken;
}

function orderWithStatus(
  tableToken: string,
  status: "PENDING" | "PREPARING" | "READY" | "COMPLETED",
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
    estimateWaitMinutes: 8,
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

test("pending order marks receiving as the active service step", async ({ page, request }) => {
  const tableToken = await getTableToken(request);
  test.skip(!tableToken, "Cần một bàn trống để route chi tiết không bị server 404");
  const order = orderWithStatus(tableToken!, "PENDING");
  await mockCustomerOrder(page, tableToken!, order);

  await page.goto(`/menu/${tableToken}/orders/${order.id}`);

  await expect(page.getByText("Đang tiếp nhận", { exact: true })).toBeVisible();
  await expect(page.getByText("Đang tiến hành", { exact: false })).toHaveCount(0);
  await expect(page.getByTestId("service-step-active")).toHaveText(/Đang tiếp nhận/);
});

test("service step labels distinguish completed work from the current work", async ({ page, request }) => {
  const tableToken = await getTableToken(request);
  test.skip(!tableToken, "Cần một bàn trống để route chi tiết không bị server 404");
  for (const [status, expectedLabels] of [
    ["PREPARING", ["Đã tiếp nhận", "Đang pha chế"]],
    ["READY", ["Đã pha chế", "Sẵn sàng phục vụ"]],
  ] as const) {
    const order = orderWithStatus(tableToken!, status);
    await mockCustomerOrder(page, tableToken!, order);
    await page.goto(`/menu/${tableToken}/orders/${order.id}`);

    for (const label of expectedLabels) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(page.getByTestId("service-step-active")).toHaveText(expectedLabels[1]);
    await page.unroute(`**/api/order/by-token/${tableToken}`);
    await page.unroute(`**/api/order/events/by-table/${tableToken}`);
  }
});

test("completed order shows every service step as completed", async ({ page, request }) => {
  const tableToken = await getTableToken(request);
  test.skip(!tableToken, "Cần một bàn trống để route chi tiết không bị server 404");
  const order = orderWithStatus(tableToken!, "COMPLETED");
  await mockCustomerOrder(page, tableToken!, order);

  await page.goto(`/menu/${tableToken}/orders/${order.id}`);

  await expect(page.getByText("Đã sẵn sàng phục vụ", { exact: true })).toBeVisible();
  await expect(page.getByText("Đã phục vụ", { exact: true })).toBeVisible();
  await expect(page.getByTestId("service-step-active")).toHaveCount(0);
});
