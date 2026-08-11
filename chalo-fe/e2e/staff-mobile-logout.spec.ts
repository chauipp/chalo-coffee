import { expect, test } from "@playwright/test";

test("staff mobile đăng xuất từ thanh đáy", async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(`${message.text()} @ ${message.location().url}`);
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/login");
  await page.locator("#username").fill("staff");
  await page.locator("#password").fill("123456");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/staff/orders");

  const logout = page.getByRole("button", { name: "Đăng xuất" });
  await expect(logout).toBeVisible();
  await expect(
    page.locator("body").evaluate((element) => element.scrollWidth > element.clientWidth),
  ).resolves.toBe(false);
  await page.screenshot({
    path: testInfo.outputPath("staff-mobile-before-logout.png"),
    fullPage: true,
  });

  await logout.click();
  await page.waitForURL("**/login");
  expect(
    consoleErrors.filter((error) => !error.includes("/api/order/events")),
  ).toEqual([]);
  expect(failedResponses).toEqual([]);
});
