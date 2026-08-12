import { expect, test, type Page } from "@playwright/test";

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
  email: "chau@example.com",
  role: "CUSTOMER",
  permission: [],
};

const shortcut = {
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

async function authenticateCustomer(page: Page) {
  await page.addInitScript((user) => {
    localStorage.setItem(
      "chalo-auth",
      JSON.stringify({
        state: {
          accessToken: "customer-access-token",
          refreshToken: "customer-refresh-token",
          user,
        },
        version: 0,
      }),
    );
    document.cookie = "ACCESS_TOKEN=customer-access-token; path=/";
    document.cookie = "USER_ROLE=CUSTOMER; path=/";
  }, customer);
}

async function mockCustomerApis(page: Page) {
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(apiResponse(customer)),
    }),
  );
  await page.route("**/api/customer/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(apiResponse(customer)),
    }),
  );
  await page.route("**/api/customer/table-session", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(apiResponse(shortcut)),
    }),
  );
  await page.route("**/api/customer/loyalty", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(apiResponse({ balance: 245 })),
    }),
  );
  await page.route("**/api/customer/orders?*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        apiResponse({
          list: [
            {
              id: "order-abcdef",
              tableId: "table-1",
              tableToken: "fixed-qr",
              table: { id: "table-1", name: "Bàn 05", area: "Tầng 1" },
              items: [
                {
                  id: "item-1",
                  productId: "product-1",
                  productName: "Cà phê sữa đá",
                  productImageUrl: null,
                  price: 35_000,
                  quantity: 2,
                  preparedQuantity: 2,
                  subtotal: 70_000,
                  note: null,
                },
              ],
              status: "COMPLETED",
              paidStatus: true,
              totalAmount: 70_000,
              estimatedWaitMinutes: 5,
              note: null,
              createdAt: "2026-08-12T02:00:00.000Z",
              updatedAt: "2026-08-12T02:10:00.000Z",
            },
          ],
          total: 1,
          pageNo: 1,
          pageSize: 10,
        }),
      ),
    }),
  );
}

test.beforeEach(async ({ page }) => {
  await authenticateCustomer(page);
  await mockCustomerApis(page);
});

test("customer sees points and can continue only their active shortcut", async ({
  page,
}, testInfo) => {
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

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/account");

  await expect(
    page.getByRole("heading", { name: "Tài khoản của bạn" }),
  ).toBeVisible();
  await expect(page.getByText("245 điểm")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Tiếp tục gọi món" }),
  ).toHaveAttribute("href", "/menu/fixed-qr");
  await expect(page.getByText("Cà phê sữa đá × 2")).toBeVisible();
  await expect(page.getByRole("button", { name: "Đăng xuất" })).toBeVisible();
  await expect(
    page.locator("body").evaluate((body) => body.scrollWidth <= body.clientWidth),
  ).resolves.toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("customer-account-mobile.png"),
    fullPage: true,
  });

  expect(consoleErrors).toEqual([]);
  expect(failedResponses).toEqual([]);
});

test("leaving a table removes only the customer's shortcut", async ({ page }) => {
  let leaveRequests = 0;
  await page.route("**/api/customer/table-session/leave", async (route) => {
    leaveRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(apiResponse(null)),
    });
  });

  await page.goto("/account");
  await page.getByRole("button", { name: "Tôi đã rời bàn" }).click();
  await expect(page.getByText("Việc này không đóng bàn và không ảnh hưởng khách khác.")).toBeVisible();
  await page.getByRole("button", { name: "Rời bàn", exact: true }).click();

  await expect(page.getByText("Chưa có bàn đang dùng")).toBeVisible();
  expect(leaveRequests).toBe(1);
});

test("manual QR token opens menu without asking whether the group is old or new", async ({
  page,
}) => {
  const scanBodies: unknown[] = [];
  await page.route("**/api/customer/table-session/scan", async (route) => {
    scanBodies.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(apiResponse(shortcut)),
    });
  });
  await page.route("**/menu/fixed-qr", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><html><body><main><h1>Menu Bàn 05</h1></main></body></html>",
    }),
  );

  await page.goto("/account");
  await page.getByRole("button", { name: "Quét mã bàn" }).click();
  await page.getByLabel("Mã bàn hoặc liên kết QR").fill("fixed-qr");
  await page.getByRole("button", { name: "Vào bàn" }).click();

  await expect(page).toHaveURL(/\/menu\/fixed-qr$/);
  expect(scanBodies).toEqual([{ tableToken: "fixed-qr" }]);
  await expect(page.getByText(/cùng nhóm|nhóm mới/i)).toHaveCount(0);
});

test("manual QR rejects foreign links before calling the API", async ({ page }) => {
  let scanRequests = 0;
  await page.route("**/api/customer/table-session/scan", async (route) => {
    scanRequests += 1;
    await route.abort();
  });

  await page.goto("/account");
  await page.getByRole("button", { name: "Quét mã bàn" }).click();
  await page
    .getByLabel("Mã bàn hoặc liên kết QR")
    .fill("https://evil.example/menu/fixed-qr");
  await page.getByRole("button", { name: "Vào bàn" }).click();

  await expect(page.getByText("Liên kết QR không thuộc Chalo Coffee.")).toBeVisible();
  expect(scanRequests).toBe(0);
});

test("account redirects unauthenticated visitors to login", async ({ browser }) => {
  const context = await browser.newContext({
    serviceWorkers: "block",
  });
  const page = await context.newPage();

  await page.goto("/account", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/login\?redirect=%2Faccount$/);
  await context.close();
});
