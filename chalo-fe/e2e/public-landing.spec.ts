import { expect, test } from "@playwright/test";

const MAPS_URL = "https://maps.app.goo.gl/miDX5WUrMF9vxkia8?g_st=ac";
const ZALO_URL = "https://zalo.me/0913017988";

test("landing công khai dẫn khách tới menu, bản đồ và đăng nhập", async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: /Một ly ngon/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Đăng nhập" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Đăng ký" })).toHaveCount(0);

  const maps = page.getByRole("link", { name: "Tìm đường tới quán" });
  await expect(maps).toHaveAttribute("href", MAPS_URL);
  await expect(maps).toHaveAttribute("target", "_blank");
  await expect(page.getByRole("main").getByRole("link", { name: "Nhắn Zalo" })).toHaveAttribute("href", ZALO_URL);
  const quickActions = page.getByRole("navigation", { name: "Liên hệ nhanh" });
  await expect(quickActions.getByRole("link", { name: "Nhắn Zalo" })).toHaveAttribute("href", ZALO_URL);
  await expect(quickActions.getByRole("link", { name: "Nhắn Zalo" })).toHaveAttribute("target", "_blank");
  await expect(quickActions.getByRole("link", { name: "Chỉ đường" })).toHaveAttribute("href", MAPS_URL);
  await expect(quickActions.getByRole("link", { name: "Chỉ đường" })).toHaveAttribute("target", "_blank");
  await expect(page.getByRole("button", { name: "Cần tỉnh táo" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Muốn nhẹ nhàng" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Muốn ngọt một chút" })).toBeVisible();

  await page.getByRole("button", { name: "Cần tỉnh táo" }).click();
  await expect(page.locator("#menu")).toBeInViewport();

  await page.getByRole("link", { name: "Xem thực đơn" }).click();
  await expect(page.locator("#menu")).toBeInViewport();
  await expect(page.getByRole("heading", { level: 2, name: "Chọn món bạn thích" })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("body").evaluate((element) => element.scrollWidth <= element.clientWidth)).resolves.toBe(true);
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight + 400, behavior: "instant" }));
  await expect(page.getByRole("navigation", { name: "Thao tác nhanh" })).toBeVisible();
  await expect(quickActions).toBeVisible();
  await expect(page.locator("body").evaluate((element) => element.scrollWidth <= element.clientWidth)).resolves.toBe(true);
  await page.getByRole("link", { name: "Thực đơn", exact: true }).last().click();
  await expect(page.locator("#menu")).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath("public-landing-mobile.png"), fullPage: true });

  await page.getByRole("link", { name: "Đăng nhập" }).first().click();
  await page.waitForURL("**/login");

  expect(consoleErrors).toEqual([]);
  expect(failedResponses).toEqual([]);
});
