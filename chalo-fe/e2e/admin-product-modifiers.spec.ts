import { expect, test } from "@playwright/test";

test("admin can configure free product modifier options on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/login");
  await page.locator("#username").fill("admin");
  await page.locator("#password").fill(process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? "admin");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/admin/dashboard");
  await page.goto("/admin/menu/products");
  const card = page.getByTestId("product-mobile-card").first();
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.getByRole("button", { name: /M.*ch.*nh s.*a/i }).click();
  const dialog = page.getByRole("dialog", { name: "Chỉnh sửa sản phẩm" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Thêm nhóm" }).click();
  await dialog.getByLabel("Tên nhóm tùy chọn 1").fill("Size");
  await dialog.getByLabel("Lựa chọn 1 nhóm 1").fill("Lớn");
  await expect(dialog.getByLabel("Phụ thu lựa chọn 1 nhóm 1")).toHaveValue("0");
  await dialog.getByRole("button", { name: /Thêm lựa chọn/ }).click();
  await expect(dialog.getByLabel("Phụ thu lựa chọn 2 nhóm 1")).toHaveValue("0");
  await expect(dialog).toHaveScreenshot("admin-product-modifiers-mobile.png");
  expect(await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
});
