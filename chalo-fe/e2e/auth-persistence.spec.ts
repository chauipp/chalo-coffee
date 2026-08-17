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

test("admin login writes cookies that survive a browser restart", async ({
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
});

test("staff login opens POS by default", async ({ page }) => {
  await loginAs(page, "MODERATOR");
  await page.waitForURL("**/staff/pos");
});
