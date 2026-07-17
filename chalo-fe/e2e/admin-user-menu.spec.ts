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
  // Anchor the absence claim to a page that actually rendered — otherwise
  // this would also pass if the sidebar failed to render at all.
  await expect(page.getByTestId("user-menu-trigger")).toBeVisible();
  await expect(page.getByLabel(/Đổi giao diện/)).toHaveCount(0);
});

test("keyboard: Tab from the open trigger reaches the theme switch, not main content", async ({
  page,
}) => {
  await loginAsAdmin(page);

  await page.getByTestId("user-menu-trigger").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("user-menu-panel")).toBeVisible();

  await page.keyboard.press("Tab");
  await expect(page.getByTestId("theme-switch")).toBeFocused();
});

test("keyboard-activating a sidebar nav link closes the menu on navigation", async ({
  page,
}) => {
  await loginAsAdmin(page);

  await page.getByTestId("user-menu-trigger").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("user-menu-panel")).toBeVisible();

  const menuLink = page.getByRole("link", { name: "Thực đơn" });
  await menuLink.focus();
  await page.keyboard.press("Enter");

  await page.waitForURL("**/admin/menu/categories");
  await expect(page.getByTestId("user-menu-panel")).toBeHidden();
});

test("keyboard-activating the sidebar collapse chevron closes the menu", async ({
  page,
}) => {
  await loginAsAdmin(page);

  await page.getByTestId("user-menu-trigger").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("user-menu-panel")).toBeVisible();

  await page.getByTitle("Thu gọn menu").focus();
  await page.keyboard.press("Enter");

  await expect(page.getByTestId("user-menu-panel")).toBeHidden();
});

test("sidebar expanded: panel does not repeat the name/role already shown on the trigger", async ({
  page,
}) => {
  await loginAsAdmin(page);

  const trigger = page.getByTestId("user-menu-trigger");
  await expect(trigger).toContainText("ADMIN");

  await trigger.click();
  const panel = page.getByTestId("user-menu-panel");
  await expect(panel).toBeVisible();
  await expect(panel).not.toContainText("ADMIN");
});

test("sidebar collapsed: panel shows the name/role since the trigger no longer does", async ({
  page,
}) => {
  await loginAsAdmin(page);

  await page.getByTitle("Thu gọn menu").click();

  const trigger = page.getByTestId("user-menu-trigger");
  await trigger.click();
  const panel = page.getByTestId("user-menu-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("ADMIN");
});

test.describe("system theme with OS dark preference", () => {
  test.use({ colorScheme: "dark" });

  test("theme switch knob agrees with OS dark preference before any interaction", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.getByTestId("user-menu-trigger").click();

    await expect(page.getByTestId("theme-switch")).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});
