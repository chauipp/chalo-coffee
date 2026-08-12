import { expect, test } from "@playwright/test";

const admin = {
  id: 1,
  username: "admin",
  fullName: "Admin",
  avatar: null,
  role: "ADMIN",
  permissions: [],
};

const ok = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ code: 200, message: "success", data }),
});

test("sidebar admin ghim viewport và menu tài khoản nằm trên nội dung khi cuộn", async ({ page }) => {
  await page.route("**/api/auth/login", (route) =>
    route.fulfill(ok({ accessToken: "admin-token", refreshToken: "admin-refresh", user: admin })),
  );
  await page.route("**/api/auth/me", (route) => route.fulfill(ok(admin)));
  await page.route("**/api/order/page**", (route) =>
    route.fulfill(ok({ list: Array.from({ length: 28 }, (_, index) => ({
      id: `order-${index}`,
      tableId: "table-1",
      tableName: "Bàn 01",
      tableToken: "token-1",
      status: "COMPLETED",
      paidStatus: false,
      items: [],
      totalAmount: 29_000,
      estimateWaitMinutes: null,
      note: null,
      createdAt: "2026-08-12T13:00:00.000Z",
      updatedAt: "2026-08-12T13:00:00.000Z",
    })), total: 28 })),
  );
  await page.route("**/api/table/list", (route) => route.fulfill(ok([])));

  await page.goto("/login");
  await page.locator("#username").fill("admin");
  await page.locator("#password").fill("admin");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin/dashboard");
  await page.goto("/admin/orders");
  await expect(page.getByTestId("user-menu-trigger")).toBeVisible();

  const sidebar = page.locator("aside");
  const before = await sidebar.boundingBox();
  expect(before).not.toBeNull();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const after = await sidebar.boundingBox();
  expect(after).not.toBeNull();
  expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(1);

  await page.getByTestId("user-menu-trigger").click();
  const panel = page.getByTestId("user-menu-panel");
  await expect(panel).toBeVisible();
  const menuBox = await panel.boundingBox();
  expect(menuBox).not.toBeNull();
  expect(menuBox!.x).toBeGreaterThanOrEqual(0);
  expect(menuBox!.y).toBeGreaterThanOrEqual(0);
  await expect(panel.getByRole("button", { name: "Đăng xuất" })).toBeVisible();
});
