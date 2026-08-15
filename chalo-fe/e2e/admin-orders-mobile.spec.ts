import { expect, test } from "@playwright/test";

const ok = (data: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ code: 200, message: "success", data }) });

test("admin mở và đóng khu pha chế ở mobile mà không tràn ngang", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.route("**/api/auth/me", (route) => route.fulfill(ok({ id: 1, username: "admin", role: "ADMIN", permissions: ["*"] })));
  await page.route("**/api/order/active**", (route) => route.fulfill(ok([])));
  await page.goto("/admin/orders");
  const toggle = page.getByRole("button", { name: "Pha chế" });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.getByRole("dialog", { name: "Khu pha chế" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Khu pha chế" })).toHaveCount(0);
  expect(await page.locator("body").evaluate((body) => body.scrollWidth <= window.innerWidth)).toBe(true);
});
