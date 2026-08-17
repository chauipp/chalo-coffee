import { expect, test } from "@playwright/test";

const roleDestinations = [
  ["ADMIN", "/admin/dashboard"],
  ["MODERATOR", "/staff/orders"],
  ["CUSTOMER", "/account"],
] as const;

for (const [role, destination] of roleDestinations) {
  test(`${role} mở / được chuyển tới ${destination}`, async ({
    context,
    page,
    baseURL,
  }) => {
    await context.addCookies([
      { name: "ACCESS_TOKEN", value: `${role}-token`, url: baseURL },
      { name: "USER_ROLE", value: role, url: baseURL },
    ]);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(new RegExp(`${destination}$`));
  });
}

test("khách chưa đăng nhập mở / vẫn thấy landing", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { level: 1, name: /Một ly ngon/i }),
  ).toBeVisible();
});

test("role không ánh xạ có token mở / vẫn thấy landing", async ({
  context,
  page,
  baseURL,
}) => {
  await context.addCookies([
    { name: "ACCESS_TOKEN", value: "unknown-role-token", url: baseURL },
    { name: "USER_ROLE", value: "UNKNOWN_ROLE", url: baseURL },
  ]);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { level: 1, name: /Một ly ngon/i }),
  ).toBeVisible();
});

test("role không ánh xạ có token mở /menu vẫn giữ menu", async ({
  context,
  page,
  baseURL,
}) => {
  await context.addCookies([
    { name: "ACCESS_TOKEN", value: "unknown-role-token", url: baseURL },
    { name: "USER_ROLE", value: "UNKNOWN_ROLE", url: baseURL },
  ]);

  await page.goto("/menu", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/menu$/);
});
