import { expect, test, type Page } from "@playwright/test";

const ok = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ code: 200, message: "success", data }),
});

const staff = {
  id: "staff-performance", username: "staff", fullName: "Nhân viên", avatar: null,
  role: "MODERATOR", permissions: ["order:read"],
};

const products = Array.from({ length: 300 }, (_, index) => ({
  id: `performance-${index}`,
  categoryId: "performance-category",
  categoryName: "Hiệu năng",
  name: `Món hiệu năng ${index}`,
  description: null,
  imageUrl: null,
  price: 20_000 + index,
  status: "AVAILABLE",
  sortOrder: index,
  isActive: true,
  prepTime: 5,
  modifierGroups: [],
  createdAt: "2026-08-16T08:00:00.000Z",
}));

async function installFixture(page: Page) {
  await page.route("**/api/auth/login", (route) =>
    route.fulfill(ok({ accessToken: "test-token", refreshToken: "test-refresh", user: staff })),
  );
  await page.route("**/api/auth/me", (route) => route.fulfill(ok(staff)));
  await page.route("**/api/menu/category/simple-list", (route) => route.fulfill(ok([])));
  await page.route("**/api/menu/product/page**", (route) => route.fulfill(ok({ list: products, total: products.length })));
  await page.route("**/api/table/list", (route) => route.fulfill(ok([])));
  await page.route("**/api/order/active", (route) => route.fulfill(ok([])));
  await page.route("**/api/order/events**", (route) => route.fulfill({
    status: 200,
    contentType: "text/event-stream",
    body: ": fixture connected\n\n",
  }));
}

async function login(page: Page) {
  await page.goto("/login");
  await page.locator("#username").fill("staff");
  await page.locator("#password").fill("password");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/staff/**");
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 375, height: 667 },
]) {
  test(`POS production measurement stays smooth on ${viewport.name}`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedResponses: string[] = [];
    let pagerRequests = 0;
    await page.setViewportSize(viewport);
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(`${message.text()} @ ${message.location().url}`);
    });
    page.on("response", (response) => {
      if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
    });
    await installFixture(page);
    await page.route("**/api/pager/list**", (route) => {
      pagerRequests += 1;
      return route.fulfill(ok([]));
    });

    await login(page);
    await page.goto("/staff/pos");
    await expect(page.getByTestId("pos-product-scroll")).toBeVisible();
    await expect.poll(() => page.getByTestId("pos-product-card").count()).toBeLessThan(100);
    await page.locator('[data-testid="pos-product-scroll"]').evaluate((element) => {
      element.scrollTop = element.scrollHeight;
      element.dispatchEvent(new Event("scroll"));
    });
    await expect(page.getByText("Món hiệu năng 299")).toBeVisible();
    await page.getByText("Món hiệu năng 299").click();

    if (viewport.name === "mobile") {
      await page.getByRole("button", { name: /Giỏ hàng.*1 món/ }).click();
    }
    await expect(page.getByText("Món hiệu năng 299").last()).toBeVisible();
    expect(pagerRequests).toBe(0);
    expect(consoleErrors).toEqual([]);
    expect(failedResponses).toEqual([]);
  });
}
