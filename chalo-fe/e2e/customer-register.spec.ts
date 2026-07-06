import { test, expect } from "@playwright/test";

// Exercises the real registration flow against the live backend (no mocking):
// the storefront /register form calls POST /auth/register and, on success,
// persists tokens + user and redirects to the CUSTOMER default route (/menu).
const BE = "http://localhost:8080/api";

test("customer registers through the UI and lands authenticated", async ({
  page,
}) => {
  // Unique per run so re-runs never collide on the happy path.
  const username = `cust_e2e_${Date.now()}`;

  await page.goto("/register");
  await page.locator("#fullName").fill("E2E Customer");
  await page.locator("#username").fill(username);
  await page.locator("#password").fill("secret123");
  await page.locator("#confirmPassword").fill("secret123");
  await page.getByRole("button", { name: "Đăng ký" }).click();

  // The persisted user object (Zustand -> localStorage "chalo-auth") only
  // contains the username once the 201 was unwrapped and setUser ran — this is
  // the real "logged-in" signal (not the mere presence of the key).
  await expect
    .poll(
      async () =>
        await page.evaluate(() => localStorage.getItem("chalo-auth")),
      { timeout: 20_000 },
    )
    .toContain(username);

  // CUSTOMER default route is /menu — the register hook redirected there.
  expect(page.url()).toContain("/menu");
});

test("duplicate username surfaces the backend error on the form", async ({
  page,
  request,
}) => {
  const username = `cust_e2e_dup_${Date.now()}`;

  // First registration seeds the collision (real BE call).
  const seed = await request.post(`${BE}/auth/register`, {
    data: { username, password: "secret123", fullName: "Dup Seed" },
  });
  expect(seed.status()).toBe(201);

  // Second registration of the same name, now through the UI, must fail with
  // the exact BE message rendered in the root error banner.
  await page.goto("/register");
  await page.locator("#fullName").fill("Dup Attempt");
  await page.locator("#username").fill(username);
  await page.locator("#password").fill("secret123");
  await page.locator("#confirmPassword").fill("secret123");
  await page.getByRole("button", { name: "Đăng ký" }).click();

  // Scope to the form's root error banner (the sonner toast shows the same
  // text, which would otherwise be a strict-mode match).
  await expect(
    page.locator("form").getByText("Tên đăng nhập đã tồn tại"),
  ).toBeVisible({ timeout: 15_000 });
});
