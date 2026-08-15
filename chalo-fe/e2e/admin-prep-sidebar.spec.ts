import { expect, type Page, test } from "@playwright/test";

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.locator("#username").fill("admin");
  await page
    .locator("#password")
    .fill(process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? "admin");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin/dashboard");
}

test("admin prep rail creates an adjacent pane across dashboard and orders", async ({
  page,
}) => {
  // Log in through the actual form so the middleware receives the auth cookies.
  await loginAsAdmin(page);

  for (const { path, content } of [
    { path: "/admin/dashboard", content: "Tổng quan" },
    { path: "/admin/orders", content: "Đơn hàng" },
  ]) {
    await page.goto(path);
    await page.evaluate(() => localStorage.removeItem("admin-prep-visible:v1"));
    await page.reload();

    const pageContent = page
      .getByRole("heading", { name: content, exact: true })
      .first();
    const launcher = page.getByTestId("admin-prep-rail-action");
    await expect(pageContent).toBeVisible();
    await expect(launcher).toBeVisible();
    await expect(launcher).toHaveAttribute("aria-label", "Khu pha chế");
    await expect(launcher).toHaveAttribute("aria-pressed", "false");

    await launcher.click();
    await expect(launcher).toHaveAttribute("aria-pressed", "true");

    const resizer = page.getByTestId("split-resizer");
    const dock = page.locator("#admin-prep-dock");
    await expect(resizer).toBeVisible();
    await expect(dock.getByRole("heading", { name: "Đang pha chế" })).toBeVisible();
    await expect(pageContent).toBeVisible();

    // SplitPane keeps the route content and dock in separate, non-overlapping
    // flex panes; this guards against accidentally turning the dock into an overlay.
    const leftPane = resizer.locator("xpath=preceding-sibling::div[1]");
    const rightPane = resizer.locator("xpath=following-sibling::div[1]");
    const [leftBox, resizerBox, rightBox] = await Promise.all([
      leftPane.boundingBox(),
      resizer.boundingBox(),
      rightPane.boundingBox(),
    ]);
    expect(leftBox).not.toBeNull();
    expect(resizerBox).not.toBeNull();
    expect(rightBox).not.toBeNull();
    expect(leftBox!.x + leftBox!.width).toBeLessThanOrEqual(resizerBox!.x + 1);
    expect(rightBox!.x).toBeGreaterThanOrEqual(resizerBox!.x + resizerBox!.width - 1);
    expect(rightBox!.width).toBeGreaterThan(0);

    await launcher.click();
    await expect(resizer).toHaveCount(0);
    await expect(launcher).toBeVisible();
    await expect(launcher).toHaveAttribute("aria-pressed", "false");

    await launcher.click();
    await expect(resizer).toBeVisible();
    await expect(dock.getByRole("heading", { name: "Đang pha chế" })).toBeVisible();
  }
});
