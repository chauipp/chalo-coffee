import { expect, test } from "@playwright/test";

test("mobile admin does not show the global desktop prep rail", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/login");
  await page.locator("#username").fill("admin");
  await page
    .locator("#password")
    .fill(process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? "admin");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin/dashboard");

  await page.goto("/admin/orders");
  await expect(
    page.getByRole("heading", { name: "Đơn hàng", exact: true }).first(),
  ).toBeVisible();
  await expect(page.locator('[aria-controls="admin-prep-dock"]')).toBeHidden();
  await expect(page.getByTestId("split-resizer")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Đang pha chế" })).toHaveCount(0);
});
