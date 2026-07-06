import { expect, Page, test } from "@playwright/test";

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.locator("#username").fill("admin");
  await page.locator("#password").fill("admin");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/admin/dashboard");
}

test("admin category name opens products filtered by that category", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.goto("/admin/menu/categories");

  const categoryLink = page
    .locator('tbody a[href*="/admin/menu/products?categoryId="]')
    .first();
  await expect(categoryLink).toBeVisible({ timeout: 15_000 });

  const href = await categoryLink.getAttribute("href");
  const categoryId = new URL(href!, "http://localhost").searchParams.get(
    "categoryId",
  );

  await categoryLink.click();
  await page.waitForURL(/\/admin\/menu\/products\?categoryId=.+/);

  await expect(page.locator("select").first()).toHaveValue(categoryId!);
  await expect(page.getByText(/^1 \/ \d+$/)).toHaveCount(0);
});

test("admin tables use continuous scrolling instead of pagination controls", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.goto("/admin/tables");

  await expect(page.locator("tbody tr").first()).toBeVisible({
    timeout: 15_000,
  });
  const totalText = await page
    .locator(".grid.grid-cols-3 > div")
    .first()
    .locator("p.text-2xl")
    .textContent();
  await expect(page.locator("tbody tr")).toHaveCount(Number(totalText?.trim()));
  await expect(page.getByText(/^1 \/ \d+$/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Sau/ })).toHaveCount(0);
});
