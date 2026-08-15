import { expect, test, type Page } from "@playwright/test";
import type { OrderDto } from "../src/services/order/order.types";

const ok = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ code: 200, message: "success", data }),
});

const customerOrder = {
  id: "20000000-0000-4000-8000-000000000001",
  tableId: "10000000-0000-4000-8000-000000000001",
  tableName: "Bàn A",
  tableToken: "fixed-print-qr",
  orderSource: "N_A",
  customerDisplayName: "Phạm Thái Châu",
  loyaltyPointsEarned: 100,
  customerEmail: "chau@gmail.com",
  status: "COMPLETED",
  paidStatus: false,
  items: [
    {
      id: "item-1",
      productId: "product-1",
      productName: "Cà phê sữa",
      productImageUrl: null,
      price: 100_999,
      quantity: 1,
      preparedQuantity: 1,
      subtotal: 100_999,
      note: null,
    },
  ],
  totalAmount: 100_999,
  estimateWaitMinutes: null,
  note: null,
  createdAt: "2026-08-12T01:00:00.000Z",
  updatedAt: "2026-08-12T01:00:00.000Z",
} as OrderDto & { customerEmail: string };

const staff = {
  id: 2,
  username: "staff",
  fullName: "Nhân viên",
  avatar: null,
  role: "MODERATOR",
  permission: ["order:read", "order:write"],
};

const admin = {
  ...staff,
  id: 1,
  username: "admin",
  fullName: "Quản trị viên",
  role: "ADMIN",
};

function captureUnexpectedBrowserFailures(page: Page) {
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];
  const ignoredUrls = ["/api/order/events", "/api/mock-sse"];
  const isIgnored = (url: string) =>
    ignoredUrls.some((ignoredUrl) => url.includes(ignoredUrl));

  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.text().includes("401 (Unauthorized)")
    ) {
      consoleErrors.push(message.text());
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && !isIgnored(response.url())) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  return { consoleErrors, failedResponses };
}

async function stubSharedApi(page: Page) {
  await page.route("**/api/auth/me", (route) => route.fulfill(ok(staff)));
  await page.route("**/api/pager/list**", (route) => route.fulfill(ok([])));
  await page.route("**/api/order/active", (route) =>
    route.fulfill(ok([customerOrder])),
  );
  await page.route("**/api/order/detail**", (route) =>
    route.fulfill(ok(customerOrder)),
  );
  await page.route("**/api/order/checkout/preview", (route) =>
    route.fulfill(
      ok({
        tableId: customerOrder.tableId,
        tableName: customerOrder.tableName,
        tableToken: customerOrder.tableToken,
        orderIds: [customerOrder.id],
        totalAmount: customerOrder.totalAmount,
        orders: [customerOrder],
      }),
    ),
  );
  await page.route("**/api/settings", (route) =>
    route.fulfill(
      ok({
        waitTimeEnabled: true,
        baristaCount: 1,
        bankBin: "970422",
        bankAccountNo: "0123456789",
        bankAccountName: "CHALO COFFEE",
      }),
    ),
  );
}

test("staff payment view displays customer and earned points without email", async ({
  page,
}) => {
  const failures = captureUnexpectedBrowserFailures(page);
  await page.setViewportSize({ width: 375, height: 667 });
  await stubSharedApi(page);
  await page.route("**/api/auth/login", (route) =>
    route.fulfill(
      ok({ accessToken: "staff-token", refreshToken: "staff-refresh", user: staff }),
    ),
  );

  await page.goto("/login");
  await page.locator("#username").fill("staff");
  await page.locator("#password").fill("staff");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/staff/**");
  await page.goto("/staff/orders");
  await page.getByRole("button", { name: /Đã phục vụ/ }).click();
  await page.locator('div[role="button"]:visible', { hasText: "Bàn A" }).click();

  await expect(page.getByText("Khách: Phạm Thái Châu")).toBeVisible();
  await page.getByRole("button", { name: "💵 Thanh toán" }).click();
  await expect(page.getByText("Cộng 100 điểm")).toBeVisible();
  await expect(page.getByText(/@gmail\.com/)).toHaveCount(0);

  const bodyOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(bodyOverflow).toBe(false);
  expect(failures.consoleErrors).toEqual([]);
  expect(failures.failedResponses).toEqual([]);
});

test("admin order list displays compact customer loyalty context without email", async ({
  page,
}) => {
  const failures = captureUnexpectedBrowserFailures(page);
  await page.setViewportSize({ width: 375, height: 667 });
  await page.route("**/api/auth/login", (route) =>
    route.fulfill(
      ok({ accessToken: "admin-token", refreshToken: "admin-refresh", user: admin }),
    ),
  );
  await page.route("**/api/auth/me", (route) => route.fulfill(ok(admin)));
  await page.route("**/api/order/stats/revenue**", (route) =>
    route.fulfill(ok({ totalRevenue: 0, totalOrders: 0, data: [] })),
  );
  await page.route("**/api/order/stats/top-products**", (route) =>
    route.fulfill(ok([])),
  );
  await page.route("**/api/table/list", (route) => route.fulfill(ok([])));
  await page.route("**/api/order/page**", (route) =>
    route.fulfill(ok({ list: [customerOrder], total: 1 })),
  );

  await page.goto("/login");
  await page.locator("#username").fill("admin");
  await page.locator("#password").fill("admin");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin/dashboard");
  await page.goto("/admin/orders");

  const card = page.getByTestId("admin-mobile-order-card");
  await expect(card.getByText("Phạm Thái Châu")).toBeVisible();
  await expect(card.getByText("+100 điểm")).toBeVisible();
  await expect(page.getByText(/@gmail\.com/)).toHaveCount(0);
  expect(failures.consoleErrors).toEqual([]);
  expect(failures.failedResponses).toEqual([]);
});
