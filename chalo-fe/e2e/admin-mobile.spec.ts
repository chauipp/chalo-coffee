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
  const mobileList = page.getByTestId("product-mobile-list");
  await expect(mobileList).toBeVisible();

  await expect(
    page.getByRole("navigation", { name: "Điều hướng admin trên điện thoại" }),
  ).toBeVisible();
  await expect(page.locator("aside")).toBeHidden();

  await page.getByRole("button", { name: "Bộ lọc sản phẩm" }).click();
  const filterSheet = page.getByRole("dialog", { name: "Lọc sản phẩm" });
  const statusFilter = filterSheet.getByLabel("Trạng thái sản phẩm");
  await statusFilter.selectOption("AVAILABLE");
  await expect(statusFilter).toHaveValue("AVAILABLE");
  await page.getByRole("button", { name: "Áp dụng bộ lọc" }).click();
  await expect(page.getByTestId("active-product-filter")).toContainText(
    "Còn hàng",
  );

  const productName = mobileList
    .getByTestId("product-mobile-card")
    .first()
    .getByRole("button", { name: /Mở chỉnh sửa/ });
  await expect(productName).toBeVisible({ timeout: 15_000 });
  await productName.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const nameInput = dialog.locator("input").first();
  const draftName = `${await nameInput.inputValue()} mobile draft`;
  await nameInput.fill(draftName);
  await page.waitForTimeout(350);

  await page.reload();
  await expect(page.getByTestId("active-product-filter")).toContainText(
    "Còn hàng",
  );
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

test("mobile admin presents every data collection as readable cards", async ({ page }) => {
  await loginAsAdmin(page);
  for (const [path, testId] of [
    ["/admin/menu/categories", "admin-mobile-category-card"],
    ["/admin/tables", "admin-mobile-table-card"],
    ["/admin/orders", "admin-mobile-order-card"],
    ["/admin/staff", "admin-mobile-staff-card"],
  ]) {
    await page.goto(path);
    await expect(page.getByTestId(testId).first()).toBeVisible();
    await expect(page.locator("table")).toBeHidden();
  }
});

test("mobile dashboard and settings keep primary controls reachable", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/dashboard");

  const dashboardControls = page.getByTestId("admin-mobile-dashboard-controls");
  await expect(dashboardControls).toBeVisible();
  await expect(dashboardControls).toHaveCSS("flex-direction", "column");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin/settings");
  const settingsSave = page.getByTestId("admin-mobile-settings-save");
  await expect(settingsSave).toBeVisible();
  await expect(settingsSave).toHaveCSS("position", "sticky");
  await settingsSave.scrollIntoViewIfNeeded();
  const saveBox = await settingsSave.boundingBox();
  const mobileNavBox = await page.locator("nav.fixed").boundingBox();
  expect(saveBox).not.toBeNull();
  expect(mobileNavBox).not.toBeNull();
  expect(saveBox!.y + saveBox!.height).toBeLessThanOrEqual(mobileNavBox!.y);
  await expect(
    settingsSave.getByRole("button", { name: "Lưu thay đổi" }),
  ).toBeVisible();
});

test("mobile tab labels do not clip at phone width", async ({ page }) => {
  await loginAsAdmin(page);
  const hasClippedLabel = await page
    .getByRole("navigation", { name: "Điều hướng admin trên điện thoại" })
    .locator("span.max-w-full")
    .evaluateAll((labels) =>
      labels.some((label) => label.scrollWidth > label.clientWidth),
    );

  expect(hasClippedLabel).toBe(false);
});
