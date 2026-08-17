import { expect, test, type Page } from "@playwright/test";

const responses = {
  ADMIN: {
    accessToken: "admin-access-token",
    refreshToken: "admin-refresh-token",
    user: {
      id: "admin-1",
      username: "admin",
      fullName: "Admin",
      avatar: null,
      role: "ADMIN",
      permission: [],
    },
  },
  MODERATOR: {
    accessToken: "staff-access-token",
    refreshToken: "staff-refresh-token",
    user: {
      id: "staff-1",
      username: "staff",
      fullName: "Nhân viên",
      avatar: null,
      role: "MODERATOR",
      permission: [],
    },
  },
} as const;

const ok = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ code: 200, message: "success", data }),
});

async function loginAs(page: Page, role: keyof typeof responses) {
  await page.route("**/api/auth/login", (route) =>
    route.fulfill(ok(responses[role])),
  );

  await page.goto("/login");
  await page.locator("#username").fill(role.toLowerCase());
  await page.locator("#password").fill("password");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
}

async function mockPosData(page: Page) {
  await page.route("**/api/menu/category/simple-list", (route) =>
    route.fulfill(ok([])),
  );
  await page.route("**/api/menu/product/page**", (route) =>
    route.fulfill(ok({ list: [], total: 0 })),
  );
  await page.route("**/api/table/list", (route) => route.fulfill(ok([])));
}

test("admin login writes cookies that survive a browser restart", async ({
  browser,
  context,
  page,
}) => {
  await loginAs(page, "ADMIN");
  await page.waitForURL("**/admin/dashboard");

  const cookies = await context.cookies();
  const accessCookie = cookies.find((cookie) => cookie.name === "ACCESS_TOKEN");
  const roleCookie = cookies.find((cookie) => cookie.name === "USER_ROLE");

  expect(accessCookie?.expires).toBeGreaterThan(Date.now() / 1_000);
  expect(roleCookie?.expires).toBeGreaterThan(Date.now() / 1_000);

  const restartedContext = await browser.newContext({
    storageState: await context.storageState(),
  });
  const restartedPage = await restartedContext.newPage();
  await restartedPage.goto("/");
  await expect(restartedPage).toHaveURL(/\/admin\/dashboard$/);
  await restartedContext.close();
});

test("staff login opens POS by default on mobile without browser errors", async ({
  page,
}) => {
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
  await page.setViewportSize({ width: 375, height: 667 });
  await mockPosData(page);
  await loginAs(page, "MODERATOR");
  await page.waitForURL("**/staff/pos");
  await expect(page.getByRole("textbox", { name: "Tìm món" })).toBeVisible();
  await expect(
    page.locator("body").evaluate((body) => body.scrollWidth <= body.clientWidth),
  ).resolves.toBe(true);
  expect(consoleErrors).toEqual([]);
  expect(failedResponses).toEqual([]);
});
