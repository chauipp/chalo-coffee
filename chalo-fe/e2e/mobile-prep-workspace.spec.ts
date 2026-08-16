import { expect, test } from "@playwright/test";
import type { OrderDto } from "../src/services/order/order.types";

const now = "2026-08-16T08:00:00.000Z";

// Keep orderSource valid: PrepTableCard renders OrderSourceBadge and rejects
// missing/unknown values before the route assertions can run.
const preparingOrder: OrderDto = {
  id: "mobile-prep-order",
  tableId: "table-mobile-prep",
  tableName: "Bàn 01",
  tableToken: "table-token-mobile-prep",
  orderSource: "QR",
  status: "PREPARING",
  paidStatus: true,
  items: [{
    id: "mobile-prep-item",
    productId: "espresso",
    productName: "Espresso",
    productImageUrl: null,
    price: 30000,
    quantity: 1,
    preparedQuantity: 0,
    subtotal: 30000,
    note: null,
  }],
  totalAmount: 30000,
  estimateWaitMinutes: 5,
  note: null,
  createdAt: now,
  updatedAt: now,
};

let activeOrders: OrderDto[] = [preparingOrder];
let preparedRequests: { method: string; payload: unknown }[] = [];

const ok = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ code: 200, message: "success", data }),
});

test.beforeEach(async ({ baseURL, context, page }) => {
  activeOrders = [preparingOrder];
  preparedRequests = [];
  await context.addCookies([
    { name: "ACCESS_TOKEN", value: "test-admin-token", url: baseURL! },
    { name: "USER_ROLE", value: "ADMIN", url: baseURL! },
  ]);
  await page.addInitScript(() => {
    localStorage.setItem("chalo-auth", JSON.stringify({
      state: {
        accessToken: "test-admin-token",
        refreshToken: "test-refresh-token",
        user: { id: "1", username: "admin", fullName: "Admin", avatar: null, role: "ADMIN", permission: ["*"] },
      },
      version: 0,
    }));
  });
  await page.route("**/api/order/active**", (route) =>
    route.fulfill(ok(activeOrders)),
  );
  await page.route(
    "**/api/order/item/mobile-prep-item/prepared",
    async (route) => {
      preparedRequests.push({
        method: route.request().method(),
        payload: route.request().postDataJSON(),
      });
      activeOrders = [{
        ...preparingOrder,
        items: [{ ...preparingOrder.items[0], preparedQuantity: 1 }],
      }];
      await route.fulfill(ok(activeOrders[0]));
    },
  );
  await page.route("**/api/order/events**", (route) =>
    route.fulfill({ status: 200, contentType: "text/event-stream", body: "" }),
  );
});

test("staff và admin mở workspace pha chế riêng", async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto("/staff/prep");
  await expect(
    page.getByRole("heading", { name: "Pha chế", exact: true }),
  ).toBeVisible();
  const staffWorkspace = page.getByRole("main");
  await staffWorkspace.getByTestId("prep-mode-table").click();
  await expect(
    staffWorkspace.getByTestId("prep-table-mobile-prep-order"),
  ).toBeVisible();
  const staffUnit = staffWorkspace.getByRole("button", {
    name: "Bàn 01 — ly 1/1 Espresso",
  });
  await staffUnit.click();
  await expect.poll(() => preparedRequests).toEqual([
    { method: "PUT", payload: { preparedQuantity: 1 } },
  ]);
  await expect(staffUnit).toHaveAttribute("aria-pressed", "true");

  await page.goto("/admin/prep");
  await expect(
    page.getByRole("heading", { name: "Pha chế", exact: true }),
  ).toBeVisible();
  const adminWorkspace = page.getByRole("main");
  await adminWorkspace.getByTestId("prep-mode-table").click();
  await expect(
    adminWorkspace.getByTestId("prep-table-mobile-prep-order"),
  ).toBeVisible();

  await page.setViewportSize({ width: 375, height: 667 });
  await expect(
    page.getByRole("heading", { name: "Pha chế", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("admin-prep-mobile.png"),
    fullPage: true,
  });
  expect(failedResponses).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
