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
    status: "AVAILABLE",
    qrToken: "fixed-qr",
  },
};

async function getLiveTableToken(page: Page): Promise<string> {
  const loginResponse = await page.request.post(
    "http://localhost:8080/api/auth/login",
    { data: { username: "admin", password: "admin" } },
  );
  const accessToken = (await loginResponse.json()).data.accessToken as string;
  const tablesResponse = await page.request.get(
    "http://localhost:8080/api/table/list",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return (await tablesResponse.json()).data[0].qrToken as string;
}

async function authenticateCustomerWithCart(page: Page, tableToken: string) {
  await page.addInitScript(({ authenticatedCustomer, token }) => {
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
  }, { authenticatedCustomer: customer, token: tableToken });
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

test("customer menu updates the signed-in customer's shortcut and logo returns home without clearing cart", async ({
  page,
}) => {
  const failures = trackPageFailures(page);
  const tableToken = await getLiveTableToken(page);
  await authenticateCustomerWithCart(page, tableToken);
  const scanBodies: unknown[] = [];
  await page.route("**/api/customer/table-session/scan", async (route) => {
    scanBodies.push(route.request().postDataJSON());
    expect(route.request().headers().authorization).toBe(
      "Bearer customer-access-token",
    );
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        apiResponse({
          ...shortcut,
          tableToken,
          table: { ...shortcut.table, qrToken: tableToken },
        }),
      ),
    });
  });
  await page.route("**/api/customer/table-session", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        apiResponse({
          ...shortcut,
          tableToken,
          table: { ...shortcut.table, qrToken: tableToken },
        }),
      ),
    }),
  );

  await page.goto(`/menu/${tableToken}`);
  await expect(
    page.getByRole("link", { name: "Chalo Coffee - Trang chủ" }),
  ).toHaveAttribute("href", "/");
  await expect.poll(() => scanBodies.length).toBe(1);
  expect(scanBodies).toEqual([{ tableToken }]);

  const occupiedContinue = page.getByRole("button", {
    name: "Ăn chung, tiếp tục đặt món",
  });
  if (await occupiedContinue.isVisible()) {
    await occupiedContinue.click();
  }

  await page.getByRole("button", { name: "Thêm", exact: true }).first().click();
  await expect.poll(() => scanBodies.length).toBe(2);
  expect(scanBodies[1]).toEqual({ tableToken });

  await page
    .getByRole("link", { name: "Chalo Coffee - Trang chủ" })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const stored = localStorage.getItem("chalo-cart");
        return stored ? JSON.parse(stored).state.items[0]?.quantity : null;
      }),
    )
    .toBe(2);
  expect(failures.consoleErrors).toEqual([]);
  expect(failures.failedResponses).toEqual([]);
});

test("guest menu keeps ordering public and never calls a customer-only shortcut endpoint", async ({
  page,
}) => {
  const failures = trackPageFailures(page);
  const tableToken = await getLiveTableToken(page);
  let scanRequests = 0;
  await page.route("**/api/customer/table-session/scan", async (route) => {
    scanRequests += 1;
    await route.abort();
  });

  await page.goto(`/menu/${tableToken}`);

  await expect(page.getByText("Cold Drip")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Chalo Coffee - Trang chủ" }),
  ).toBeVisible();
  await page.waitForTimeout(300);
  expect(scanRequests).toBe(0);
  expect(failures.consoleErrors).toEqual([]);
  expect(failures.failedResponses).toEqual([]);
});
