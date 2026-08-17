import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const responses = {
  ADMIN: {
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

async function restoreBrowserSession(
  context: BrowserContext,
  role: keyof typeof responses,
  baseURL: string,
) {
  await context.addCookies([
    {
      name: "chalo_access",
      value: "http-only-session-token",
      url: baseURL,
      httpOnly: true,
      sameSite: "Strict",
      expires: Math.floor(Date.now() / 1_000) + 15 * 60,
    },
    {
      name: "chalo_refresh",
      value: "http-only-refresh-token",
      url: `${baseURL}/api/auth`,
      httpOnly: true,
      sameSite: "Strict",
      expires: Math.floor(Date.now() / 1_000) + 7 * 24 * 60 * 60,
    },
    {
      name: "chalo_role",
      value: role,
      url: baseURL,
      sameSite: "Strict",
      expires: Math.floor(Date.now() / 1_000) + 7 * 24 * 60 * 60,
    },
  ]);
}

async function mockAuthenticatedApi(page: Page, role: keyof typeof responses) {
  await page.route("**/api/auth/me", (route) => route.fulfill(ok(responses[role].user)));
  await page.route("**/api/menu/category/simple-list", (route) =>
    route.fulfill(ok([])),
  );
  await page.route("**/api/menu/product/page**", (route) =>
    route.fulfill(ok({ list: [], total: 0 })),
  );
  await page.route("**/api/table/list", (route) => route.fulfill(ok([])));
  await page.route("**/api/inventory/low-stock", (route) => route.fulfill(ok([])));
}

test("admin mở PWA lại vẫn vào dashboard từ HttpOnly cookie, không cần refresh", async ({
  browser,
  context,
  page,
  baseURL,
}) => {
  await restoreBrowserSession(context, "ADMIN", baseURL!);
  await mockAuthenticatedApi(page, "ADMIN");
  await page.goto("/");
  await expect(page).toHaveURL(/\/admin\/dashboard$/);

  const cookies = await context.cookies();
  const accessCookie = cookies.find((cookie) => cookie.name === "chalo_access");
  const roleCookie = cookies.find((cookie) => cookie.name === "chalo_role");

  expect(accessCookie?.httpOnly).toBe(true);
  expect(accessCookie?.expires).toBeGreaterThan(Date.now() / 1_000);
  expect(roleCookie?.expires).toBeGreaterThan(Date.now() / 1_000);

  const restartedContext = await browser.newContext({
    storageState: await context.storageState(),
  });
  const restartedPage = await restartedContext.newPage();
  await mockAuthenticatedApi(restartedPage, "ADMIN");
  await restartedPage.goto("/");
  await expect(restartedPage).toHaveURL(/\/admin\/dashboard$/);
  const persistedAuth = await restartedPage.evaluate(() => localStorage.getItem("chalo-auth"));
  expect(persistedAuth).not.toContain("accessToken");
  expect(persistedAuth).not.toContain("refreshToken");
  await restartedContext.close();
});

test("staff mở PWA lại đi thẳng tới POS trên mobile", async ({
  context,
  page,
  baseURL,
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
  await restoreBrowserSession(context, "MODERATOR", baseURL!);
  await mockAuthenticatedApi(page, "MODERATOR");
  await page.goto("/");
  await expect(page).toHaveURL(/\/staff\/pos$/);
  await expect(page.getByRole("textbox", { name: "Tìm món" })).toBeVisible();
  await expect(
    page.locator("body").evaluate((body) => body.scrollWidth <= body.clientWidth),
  ).resolves.toBe(true);
  expect(consoleErrors).toEqual([]);
  expect(failedResponses).toEqual([]);
});
