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
  name: index === 1
    ? "Món hiệu năng có tên dài để kiểm tra card luôn cùng chiều cao"
    : `Món hiệu năng ${index}`,
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
const filteredProduct = {
  ...products[0],
  id: "filtered-product",
  categoryId: "filtered-category",
  categoryName: "Đã lọc",
  name: "Món lọc mới",
};

const FRAME_INTERVAL_BUDGET_MS = 1000 / 24; // 24fps is the minimum usable POS scroll budget.

async function installFixture(page: Page) {
  await page.route("**/api/auth/login", (route) =>
    route.fulfill(ok({ accessToken: "test-token", refreshToken: "test-refresh", user: staff })),
  );
  await page.route("**/api/auth/me", (route) => route.fulfill(ok(staff)));
  await page.route("**/api/menu/category/simple-list", (route) => route.fulfill(ok([
    { id: "performance-category", name: "Hiệu năng" },
    { id: "filtered-category", name: "Đã lọc" },
  ])));
  await page.route("**/api/menu/product/page**", (route) => {
    const url = new URL(route.request().url());
    const isFiltered = url.searchParams.get("name") === "lọc" || url.searchParams.get("categoryId") === "filtered-category";
    return route.fulfill(ok(isFiltered
      ? { list: [filteredProduct], total: 1 }
      : { list: products, total: products.length }));
  });
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
    await expect(page.getByText("Món hiệu năng 0")).toBeVisible();
    await expect.poll(() => page.getByTestId("pos-product-card").count()).toBeGreaterThan(0);
    await expect.poll(() => page.getByTestId("pos-product-card").count()).toBeLessThan(100);
    const mountedCardHeights = await page.getByTestId("pos-product-card").evaluateAll(
      (cards) => cards.map((card) => card.getBoundingClientRect().height),
    );
    expect([...new Set(mountedCardHeights)]).toHaveLength(1);
    const frameIntervals = await page.locator('[data-testid="pos-product-scroll"]').evaluate(async (element) => {
      const intervals: number[] = [];
      let previous = performance.now();
      for (let frame = 0; frame < 90; frame += 1) {
        await new Promise<void>((resolve) => requestAnimationFrame((timestamp) => {
          intervals.push(timestamp - previous);
          previous = timestamp;
          element.scrollTop += 20;
          resolve();
        }));
      }
      return intervals.slice(1).sort((a, b) => a - b);
    });
    const p95FrameInterval = frameIntervals[Math.floor(frameIntervals.length * 0.95)];
    expect(p95FrameInterval).toBeLessThan(FRAME_INTERVAL_BUDGET_MS);
    await page.locator('[data-testid="pos-product-scroll"]').evaluate((element) => {
      element.scrollTop = element.scrollHeight;
      element.dispatchEvent(new Event("scroll"));
    });
    await expect(page.getByText("Món hiệu năng 299")).toBeVisible();
    await expect.poll(() => page.getByTestId("pos-product-card").count()).toBeGreaterThan(0);
    await expect.poll(() => page.getByTestId("pos-product-card").count()).toBeLessThan(100);
    await page.getByText("Món hiệu năng 299").click();

    await page.getByLabel("Tìm món").fill("lọc");
    await expect(page.getByText("Món lọc mới")).toBeVisible();
    await expect(page.locator('[data-testid="pos-product-scroll"]')).toHaveJSProperty("scrollTop", 0);

    if (viewport.name === "desktop") {
      await expect(page.getByText("Món hiệu năng 299").last()).toBeVisible();
    }
    await page.getByLabel("Tìm món").fill("");
    await expect(page.getByText("Món hiệu năng 0")).toBeVisible();
    await page.locator('[data-testid="pos-product-scroll"]').evaluate((element) => {
      element.scrollTop = element.scrollHeight;
      element.dispatchEvent(new Event("scroll"));
    });
    await expect(page.getByText("Món hiệu năng 299").first()).toBeVisible();
    await page.getByText("Đã lọc", { exact: true }).click();
    await expect(page.getByText("Món lọc mới")).toBeVisible();
    await expect(page.locator('[data-testid="pos-product-scroll"]')).toHaveJSProperty("scrollTop", 0);
    if (viewport.name === "mobile") {
      await page.getByRole("button", { name: /Giỏ hàng.*1 món/ }).click();
      await expect(page.getByText("Món hiệu năng 299").last()).toBeVisible();
    }
    expect(pagerRequests).toBe(0);
    expect(consoleErrors).toEqual([]);
    expect(failedResponses).toEqual([]);
  });
}
