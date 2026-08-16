import { expect, test } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";
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

type TestPersona = "ADMIN" | "MODERATOR";

async function usePersona(
  page: Page,
  context: BrowserContext,
  baseURL: string,
  role: TestPersona,
) {
  const user = role === "ADMIN"
    ? { id: "1", username: "admin", fullName: "Admin", role, permission: ["*"] }
    : { id: "2", username: "staff", fullName: "Nhân viên", role, permission: [] };
  const accessToken = `test-${role.toLowerCase()}-token`;

  // Establish a same-origin document before adding auth cookies. Otherwise
  // /login redirects to the role home and creates an unrelated active-order
  // request before this helper has written the intended local auth state.
  if (new URL(page.url()).origin !== new URL(baseURL).origin) {
    await page.goto(`${baseURL}/login`);
  }
  await context.clearCookies();
  await context.addCookies([
    { name: "ACCESS_TOKEN", value: accessToken, url: baseURL },
    { name: "USER_ROLE", value: role, url: baseURL },
  ]);
  await page.evaluate(
    ({ accessToken: token, user: authenticatedUser }) => {
      localStorage.setItem("chalo-auth", JSON.stringify({
        state: {
          accessToken: token,
          refreshToken: "test-refresh-token",
          user: { ...authenticatedUser, avatar: null },
        },
        version: 0,
      }));
    },
    { accessToken, user },
  );
}

const ok = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ code: 200, message: "success", data }),
});

test.beforeEach(async ({ page }) => {
  activeOrders = [preparingOrder];
  preparedRequests = [];
  await page.route("**/api/order/active**", (route) =>
    route.fulfill(ok(activeOrders)),
  );
  await page.route("**/api/table/list**", (route) => route.fulfill(ok([])));
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
  await page.route("**/api/auth/logout", (route) => route.fulfill(ok(null)));
});

test("staff và admin mở workspace pha chế riêng", async ({ baseURL, context, page }, testInfo) => {
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

  await usePersona(page, context, baseURL!, "MODERATOR");
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

  await usePersona(page, context, baseURL!, "ADMIN");
  await expect
    .poll(() => page.evaluate(() => {
      const auth = localStorage.getItem("chalo-auth");
      return auth ? JSON.parse(auth).state.user.role : null;
    }))
    .toBe("ADMIN");
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

test("mobile navigation đưa Pha chế ra tab trực tiếp và giữ Khác khả dụng", async ({ baseURL, context, page }) => {
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

  await page.setViewportSize({ width: 375, height: 667 });

  await usePersona(page, context, baseURL!, "MODERATOR");
  await page.goto("/staff/orders");
  const staffNav = page.getByTestId("staff-mobile-nav");
  await staffNav.getByRole("link", { name: "Pha chế" }).click();
  await page.waitForURL("**/staff/prep");
  await expect(staffNav.getByRole("link", { name: "Pha chế" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await staffNav.getByRole("button", { name: "Khác" }).click();
  const staffOverflow = page.getByRole("dialog", { name: "Mục staff khác" });
  await expect(staffOverflow.getByRole("link", { name: "Chốt ca" })).toBeVisible();
  await expect(staffOverflow.getByRole("button", { name: "Đăng xuất" })).toBeVisible();

  await usePersona(page, context, baseURL!, "ADMIN");
  await page.goto("/admin/orders");
  const adminNav = page.getByTestId("admin-mobile-nav");
  await expect(adminNav.getByRole("link", { name: "Tổng quan" })).toBeVisible();
  await adminNav.getByRole("link", { name: "Pha chế" }).click();
  await page.waitForURL("**/admin/prep");
  await expect(adminNav.getByRole("link", { name: "Pha chế" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.getByRole("main").getByTestId("prep-mode-table").click();
  const prepCard = page.getByRole("main").getByTestId("prep-table-mobile-prep-order");
  await prepCard.scrollIntoViewIfNeeded();
  const prepCardBox = await prepCard.boundingBox();
  const navBox = await adminNav.boundingBox();
  expect(prepCardBox).not.toBeNull();
  expect(navBox).not.toBeNull();
  expect(prepCardBox!.y + prepCardBox!.height).toBeLessThanOrEqual(navBox!.y);

  await adminNav.getByRole("button", { name: "Khác" }).click();
  const adminOverflow = page.getByRole("dialog", { name: "Mục quản trị khác" });
  await expect(adminOverflow.getByRole("link", { name: "Bàn & QR" })).toBeVisible();

  await usePersona(page, context, baseURL!, "MODERATOR");
  await page.goto("/staff/prep");
  await staffNav.getByRole("button", { name: "Khác" }).click();
  await page
    .getByRole("dialog", { name: "Mục staff khác" })
    .getByRole("button", { name: "Đăng xuất" })
    .click();
  await page.waitForURL("**/login");
  expect(failedResponses).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("workspace pha chế ẩn không tải đơn đang làm trên các route mobile khác", async ({ baseURL, context, page }) => {
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];
  let activeOrderRequests = 0;

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });
  await page.route("**/api/order/active**", (route) => {
    activeOrderRequests += 1;
    return route.fulfill(ok(activeOrders));
  });
  await page.route("**/api/menu/product/page**", (route) =>
    route.fulfill(ok({ list: [], total: 0 })),
  );
  await page.route("**/api/order/stats/revenue**", (route) =>
    route.fulfill(ok({ totalRevenue: 0 })),
  );
  await page.route("**/api/order/stats/top-products**", (route) =>
    route.fulfill(ok([])),
  );
  await page.route("**/api/auth/refresh-token", (route) =>
    route.fulfill(ok({ accessToken: "test-admin-token", refreshToken: "test-refresh-token" })),
  );

  await page.setViewportSize({ width: 375, height: 667 });
  await usePersona(page, context, baseURL!, "MODERATOR");
  await page.goto("/staff/pos");
  await expect(page.getByRole("textbox", { name: "Tìm món" })).toBeVisible();
  await page.waitForTimeout(11_000);
  expect(activeOrderRequests).toBe(0);

  await usePersona(page, context, baseURL!, "ADMIN");
  await page.evaluate(() => {
    localStorage.setItem("admin-prep-visible:v1", "true");
  });
  await page.goto("/admin/dashboard");
  await expect(page.getByRole("heading", { name: /tổng quan/i })).toBeVisible();
  await page.waitForTimeout(11_000);
  expect(activeOrderRequests).toBe(0);

  await usePersona(page, context, baseURL!, "MODERATOR");
  await page.goto("/staff/prep");
  await expect(
    page.getByRole("heading", { name: "Pha chế", exact: true }),
  ).toBeVisible();
  await expect.poll(() => activeOrderRequests).toBeGreaterThan(0);
  expect(failedResponses).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
