import {
  test,
  expect,
  type Page,
  type Locator,
  type APIRequestContext,
} from "@playwright/test";

// Tailwind v3 set cursor:pointer on button in preflight; v4 dropped it, so a
// global rule in globals.css restores it. These tests read the computed cursor
// straight from the browser — the only way to prove the rule actually lands.

const BE = "http://localhost:8080/api";

const loginAsAdmin = async (page: Page) => {
  await page.goto("/login");
  await page.locator("#username").fill("admin");
  await page.locator("#password").fill("admin");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin/dashboard");
};

const anyTableToken = async (request: APIRequestContext) => {
  const login = await request.post(`${BE}/auth/login`, {
    data: { username: "admin", password: "admin" },
  });
  const auth = {
    Authorization: `Bearer ${(await login.json()).data.accessToken}`,
  };
  const res = await request.get(`${BE}/table/list`, { headers: auth });
  const tables = (await res.json()).data as Array<{ qrToken: string }>;
  return tables[0].qrToken;
};

const cursorOf = (el: Locator) =>
  el.evaluate((node) => getComputedStyle(node).cursor);

test("an enabled button shows the pointer", async ({ page }) => {
  await loginAsAdmin(page);
  const trigger = page.getByTestId("user-menu-trigger");
  await expect(trigger).toBeVisible();
  expect(await cursorOf(trigger)).toBe("pointer");
});

test("a disabled button shows not-allowed", async ({ page, request }) => {
  // The quantity stepper's minus button is disabled at rest (quantity starts at
  // 1) and carries no cursor utility of its own — so it only reads not-allowed
  // if the global rule is doing the work.
  await page.goto(`/menu/${await anyTableToken(request)}`);

  const minus = page.getByRole("button", { name: "Giảm số lượng" }).first();
  await expect(minus).toBeVisible();
  await expect(minus).toBeDisabled();
  expect(await cursorOf(minus)).toBe("not-allowed");
});

test("a select shows the pointer", async ({ page }) => {
  await loginAsAdmin(page);
  const select = page.locator("select").first();
  await expect(select).toBeVisible();
  expect(await cursorOf(select)).toBe("pointer");
});

test("a modal backdrop keeps the browser default", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/menu/categories");

  await page.getByRole("button", { name: "Thêm danh mục" }).click();
  const backdrop = page.locator('div[class*="bg-black/50"]').first();
  await expect(backdrop).toBeVisible();

  // A backdrop is somewhere to click away, not a control. "auto" is the CSS
  // initial value — if a future widening of the rule reaches divs, this catches it.
  expect(await cursorOf(backdrop)).toBe("auto");
});

test("a sidebar link keeps the pointer the browser gives it", async ({
  page,
}) => {
  await loginAsAdmin(page);
  const link = page.getByRole("link", { name: "Đơn hàng" });
  await expect(link).toBeVisible();
  expect(await cursorOf(link)).toBe("pointer");
});
