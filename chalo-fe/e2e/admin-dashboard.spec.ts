import { test, expect } from "@playwright/test";

// Exercises the real flow against the live backend (no mocking):
// log in as admin/admin through the UI, land on the admin dashboard,
// and assert the stat tiles + charts render with real seeded data.
test("admin can log in and see revenue dashboard with real data", async ({
  page,
}) => {
  // 1. Log in through the actual login form.
  await page.goto("/login");
  await page.locator("#username").fill("admin");
  await page.locator("#password").fill("admin");
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  // 2. ADMIN default route is the dashboard.
  await page.waitForURL("**/admin/dashboard");
  await expect(
    page.getByRole("heading", { name: "Tổng quan" }),
  ).toBeVisible();

  // Helper: the value paragraph inside a StatCard identified by its label.
  const statValue = (label: string) =>
    page
      .locator("div.rounded-2xl", { has: page.getByText(label, { exact: true }) })
      .locator("p.text-2xl");

  // 3. Total-revenue tile shows a real, non-zero VND figure ending in "đ".
  const revenueValue = statValue("Tổng doanh thu");
  await expect(revenueValue).toBeVisible({ timeout: 15_000 });
  // e.g. "15.062.000đ" — assert it is non-zero (starts with a non-zero digit).
  await expect(revenueValue).toHaveText(/^[1-9][\d.]*đ$/);

  // 4. Total-orders tile shows a positive integer.
  const ordersValue = statValue("Tổng số đơn");
  await expect(ordersValue).toBeVisible();
  await expect(ordersValue).toHaveText(/^[1-9]\d*$/);
  const ordersText = (await ordersValue.textContent())?.trim() ?? "";
  expect(Number(ordersText)).toBeGreaterThan(0);

  // 5. Best-seller tile shows a product name (not the em-dash placeholder).
  const bestSellerValue = statValue("Bán chạy nhất");
  await expect(bestSellerValue).toBeVisible();
  await expect(bestSellerValue).not.toHaveText("—");

  // 6. Revenue chart renders bars (one per date bucket) + the order-count line.
  const revenueChart = page.locator("div.rounded-2xl", {
    has: page.getByRole("heading", { name: "Doanh thu", exact: true }),
  });
  await expect(revenueChart).toBeVisible();
  const revenueBars = revenueChart.locator(".recharts-bar-rectangle");
  await expect(revenueBars.first()).toBeVisible({ timeout: 15_000 });
  expect(await revenueBars.count()).toBeGreaterThan(0);
  // Order-count line overlay.
  await expect(
    revenueChart.locator(".recharts-line-curve").first(),
  ).toBeVisible();

  // 7. Top-products chart renders horizontal bars.
  const topProductsChart = page.locator("div.rounded-2xl", {
    has: page.getByRole("heading", { name: "Sản phẩm bán chạy", exact: true }),
  });
  await expect(topProductsChart).toBeVisible();
  const topBars = topProductsChart.locator(".recharts-bar-rectangle");
  await expect(topBars.first()).toBeVisible({ timeout: 15_000 });
  expect(await topBars.count()).toBeGreaterThan(0);
});
