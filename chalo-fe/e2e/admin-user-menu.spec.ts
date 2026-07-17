import { test, expect } from "@playwright/test";

const loginAsAdmin = async (page: import("@playwright/test").Page) => {
  await page.goto("/login");
  await page.locator("#username").fill("admin");
  await page.locator("#password").fill("admin");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin/dashboard");
};

test("avatar opens a menu that closes on Escape", async ({ page }) => {
  await loginAsAdmin(page);

  const panel = page.getByTestId("user-menu-panel");
  await expect(panel).toBeHidden();

  await page.getByTestId("user-menu-trigger").click();
  await expect(panel).toBeVisible();
  await expect(panel.getByText("Đăng xuất")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
});

test("menu closes when clicking outside", async ({ page }) => {
  await loginAsAdmin(page);

  await page.getByTestId("user-menu-trigger").click();
  await expect(page.getByTestId("user-menu-panel")).toBeVisible();

  await page.getByRole("heading", { name: "Tổng quan" }).click();
  await expect(page.getByTestId("user-menu-panel")).toBeHidden();
});

test("logout from the menu returns to the login page", async ({ page }) => {
  await loginAsAdmin(page);

  await page.getByTestId("user-menu-trigger").click();
  await page.getByRole("button", { name: "Đăng xuất" }).click();

  await page.waitForURL("**/login");
  await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeVisible();
});

test("theme switch flips the theme and persists it", async ({ page }) => {
  await loginAsAdmin(page);
  await page.getByTestId("user-menu-trigger").click();

  const html = page.locator("html");
  const before = (await html.getAttribute("class")) ?? "";
  const wasDark = before.includes("dark");

  await page.getByTestId("theme-switch").click();
  await expect(html).toHaveClass(wasDark ? /light/ : /dark/);
  await expect(page.getByTestId("theme-switch")).toHaveAttribute(
    "aria-checked",
    wasDark ? "false" : "true",
  );

  // The choice is explicit now, so it must survive a reload.
  await page.reload();
  await expect(html).toHaveClass(wasDark ? /light/ : /dark/);
});

test("the fixed top-right theme toggle is gone", async ({ page }) => {
  await loginAsAdmin(page);
  await expect(page.getByLabel(/Đổi giao diện/)).toHaveCount(0);
});
