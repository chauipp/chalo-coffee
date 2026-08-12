import { expect, test, type Page } from "@playwright/test";

const MAPS_URL = "https://maps.app.goo.gl/miDX5WUrMF9vxkia8?g_st=ac";
const ZALO_URL = "https://zalo.me/0913017988";

const apiResponse = <T,>(data: T) => ({
  code: 200,
  message: "success",
  data,
});

const customer = {
  id: 42,
  username: "google_customer",
  fullName: "Phạm Thái Châu",
  avatar: null,
  role: "CUSTOMER",
  permission: [],
};

const activeShortcut = {
  id: "session-1",
  customerId: 42,
  tableId: "table-1",
  tableToken: "fixed-qr",
  status: "ACTIVE",
  startedAt: "2026-08-12T01:00:00.000Z",
  lastActivityAt: "2026-08-12T02:00:00.000Z",
  paidAt: null,
  endedAt: null,
  businessDate: "2026-08-12",
  endedReason: null,
  updatedAt: "2026-08-12T02:00:00.000Z",
  table: {
    id: "table-1",
    name: "Bàn 05",
    area: "Tầng 1",
    status: "OCCUPIED",
    qrToken: "fixed-qr",
  },
};

async function seedCustomerCart(page: Page, tableToken = "fixed-qr") {
  await page.addInitScript(
    ({ authenticatedCustomer, token }) => {
      localStorage.setItem(
        "chalo-auth",
        JSON.stringify({
          state: {
            accessToken: "customer-access-token",
            refreshToken: "customer-refresh-token",
            user: authenticatedCustomer,
          },
          version: 0,
        }),
      );
      localStorage.setItem(
        "chalo-cart",
        JSON.stringify({
          state: {
            tableToken: token,
            items: [
              {
                productId: "product-1",
                productName: "Cà phê sữa đá",
                productImageUrl: null,
                price: 35_000,
                quantity: 2,
              },
            ],
          },
          version: 0,
        }),
      );
    },
    { authenticatedCustomer: customer, token: tableToken },
  );
}

function trackPageFailures(page: Page) {
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });
  return { consoleErrors, failedResponses };
}

test("landing công khai dẫn khách tới menu, bản đồ và đăng nhập", async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: /Một ly ngon/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Đăng nhập" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Đăng ký" })).toHaveCount(0);

  const maps = page.getByRole("link", { name: "Tìm đường tới quán" });
  await expect(maps).toHaveAttribute("href", MAPS_URL);
  await expect(maps).toHaveAttribute("target", "_blank");
  await expect(page.getByRole("main").getByRole("link", { name: "Nhắn Zalo" })).toHaveAttribute("href", ZALO_URL);
  const quickActions = page.getByRole("navigation", { name: "Liên hệ nhanh" });
  await expect(quickActions.getByRole("link", { name: "Nhắn Zalo" })).toHaveAttribute("href", ZALO_URL);
  await expect(quickActions.getByRole("link", { name: "Nhắn Zalo" })).toHaveAttribute("target", "_blank");
  await expect(quickActions.getByRole("link", { name: "Chỉ đường" })).toHaveAttribute("href", MAPS_URL);
  await expect(quickActions.getByRole("link", { name: "Chỉ đường" })).toHaveAttribute("target", "_blank");
  await expect(page.getByRole("button", { name: "Cần tỉnh táo" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Muốn nhẹ nhàng" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Muốn ngọt một chút" })).toBeVisible();

  await page.getByRole("button", { name: "Cần tỉnh táo" }).click();
  await expect(page.locator("#menu")).toBeInViewport();

  await page.getByRole("link", { name: "Xem thực đơn" }).click();
  await expect(page.locator("#menu")).toBeInViewport();
  await expect(page.getByRole("heading", { level: 2, name: "Chọn món bạn thích" })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("body").evaluate((element) => element.scrollWidth <= element.clientWidth)).resolves.toBe(true);
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight + 400, behavior: "instant" }));
  await expect(page.getByRole("navigation", { name: "Thao tác nhanh" })).toBeVisible();
  await expect(quickActions).toBeVisible();
  await expect(page.locator("body").evaluate((element) => element.scrollWidth <= element.clientWidth)).resolves.toBe(true);
  await page.getByRole("link", { name: "Thực đơn", exact: true }).last().click();
  await expect(page.locator("#menu")).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath("public-landing-mobile.png"), fullPage: true });

  await page.getByRole("link", { name: "Đăng nhập" }).first().click();
  await page.waitForURL("**/login");

  expect(consoleErrors).toEqual([]);
  expect(failedResponses).toEqual([]);
});

test("landing chỉ hiện lối tắt bàn được server xác nhận và đếm đúng giỏ của bàn đó", async ({
  page,
}, testInfo) => {
  const failures = trackPageFailures(page);
  await seedCustomerCart(page);
  await page.route("**/api/customer/table-session", async (route) => {
    expect(route.request().headers().authorization).toBe(
      "Bearer customer-access-token",
    );
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(apiResponse(activeShortcut)),
    });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(
    page.getByRole("link", { name: "Tiếp tục gọi món" }),
  ).toHaveAttribute("href", "/menu/fixed-qr");
  await expect(page.getByLabel("Giỏ hàng, 2 món")).toHaveAttribute(
    "href",
    "/menu/fixed-qr",
  );
  await expect(page.getByText("Bàn 05")).toBeVisible();
  await expect(
    page.locator("body").evaluate((body) => body.scrollWidth <= body.clientWidth),
  ).resolves.toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("public-landing-customer-shortcut-mobile.png"),
    fullPage: true,
  });
  expect(failures.consoleErrors).toEqual([]);
  expect(failures.failedResponses).toEqual([]);
});

test("landing ẩn giỏ local cũ khi server không còn shortcut", async ({ page }) => {
  const failures = trackPageFailures(page);
  await seedCustomerCart(page);
  await page.route("**/api/customer/table-session", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(apiResponse(null)),
    }),
  );

  await page.goto("/");

  await expect(
    page.getByRole("link", { name: "Tiếp tục gọi món" }),
  ).toHaveCount(0);
  await expect(page.getByLabel(/Giỏ hàng,/)).toHaveCount(0);
  expect(failures.consoleErrors).toEqual([]);
  expect(failures.failedResponses).toEqual([]);
});

test("landing vẫn cho tiếp tục bàn nhưng không đếm giỏ của QR khác", async ({
  page,
}) => {
  await seedCustomerCart(page, "old-table-qr");
  await page.route("**/api/customer/table-session", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(apiResponse(activeShortcut)),
    }),
  );

  await page.goto("/");

  await expect(
    page.getByRole("link", { name: "Tiếp tục gọi món" }),
  ).toHaveAttribute("href", "/menu/fixed-qr");
  await expect(page.getByLabel("Giỏ hàng", { exact: true })).toHaveAttribute(
    "href",
    "/menu/fixed-qr",
  );
  await expect(page.getByLabel(/Giỏ hàng, \d+ món/)).toHaveCount(0);
});
