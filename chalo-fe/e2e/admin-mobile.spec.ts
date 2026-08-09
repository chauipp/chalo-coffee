import { expect, Page, test } from "@playwright/test";

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.locator("#username").fill("admin");
  await page
    .locator("#password")
    .fill(process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? "admin");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/admin/dashboard");
}

test("mobile admin restores product work after reload", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/menu/products");

  await expect(
    page.getByRole("navigation", { name: "Điều hướng admin trên điện thoại" }),
  ).toBeVisible();
  await expect(page.locator("aside")).toBeHidden();

  const statusFilter = page.locator("select").nth(1);
  await statusFilter.selectOption("AVAILABLE");
  await expect(statusFilter).toHaveValue("AVAILABLE");

  const productName = page.locator("tbody tr button").first();
  await expect(productName).toBeVisible({ timeout: 15_000 });
  await productName.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const nameInput = dialog.locator("input").first();
  const draftName = `${await nameInput.inputValue()} mobile draft`;
  await nameInput.fill(draftName);
  await page.waitForTimeout(350);

  await page.reload();
  await expect(page.locator("select").nth(1)).toHaveValue("AVAILABLE");
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await expect(dialog.locator("input").first()).toHaveValue(draftName);

  await page.getByRole("button", { name: "Hủy" }).click();
  await expect(dialog).toBeHidden();

  await page.goto("/admin");
  await page.waitForURL("**/admin/menu/products");
});

test("mobile admin uses product cards and keeps overflow navigation reachable", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/menu/products");

  const mobileList = page.getByTestId("product-mobile-list");
  await expect(mobileList).toBeVisible();
  await expect(mobileList.getByTestId("product-mobile-card").first()).toBeVisible();
  await expect(page.locator("table")).toBeHidden();

  await page.getByRole("button", { name: "Bộ lọc sản phẩm" }).click();
  await expect(page.getByRole("dialog", { name: "Lọc sản phẩm" })).toBeVisible();
  await page.getByRole("button", { name: "Đóng" }).click();

  await page.getByRole("button", { name: "Khác" }).click();
  await expect(
    page.getByRole("dialog", { name: "Mục quản trị khác" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Nhân viên" }).click();
  await page.waitForURL("**/admin/staff");
});
