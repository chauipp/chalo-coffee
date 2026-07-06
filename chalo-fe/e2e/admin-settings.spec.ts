import { test, expect } from "@playwright/test";

// Exercises the real Settings (Cài đặt) admin page against the live backend
// (no mocking): log in as admin, load current settings, flip waitTimeEnabled,
// persist it, confirm the change survives a reload, then RESTORE the default
// (waitTimeEnabled: true, baristaCount: 3) so the shared DB is left untouched.
test("admin toggles wait-time setting and it persists, then restores default", async ({
  page,
}) => {
  // 1. Log in.
  await page.goto("/login");
  await page.locator("#username").fill("admin");
  await page.locator("#password").fill("admin");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin/dashboard");

  // 2. Navigate to Settings via the real sidebar link.
  await page.getByRole("link", { name: "Cài đặt" }).click();
  await page.waitForURL("**/admin/settings");
  await expect(page.getByRole("heading", { name: "Cài đặt" })).toBeVisible();

  // 3. Current values load from GET /settings (default barista count = 3).
  const countInput = page.locator('input[type="number"]');
  await expect(countInput).toHaveValue("3", { timeout: 15_000 });
  await expect(countInput).toBeEnabled();

  const toggleTrack = page.locator("div.h-6.w-11");
  const save = page.getByRole("button", { name: "Lưu thay đổi" });

  // 4. Flip waitTimeEnabled OFF -> barista input disables, Save enables.
  await toggleTrack.click();
  await expect(countInput).toBeDisabled();
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page.getByText("Đã lưu cài đặt")).toBeVisible({
    timeout: 15_000,
  });

  // 5. Reload -> persisted OFF state loads back (input stays disabled).
  await page.reload();
  await expect(countInput).toBeDisabled({ timeout: 15_000 });

  // 6. RESTORE default: flip back ON, save, reload -> enabled + count 3.
  await toggleTrack.click();
  await expect(countInput).toBeEnabled();
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page.getByText("Đã lưu cài đặt")).toBeVisible({
    timeout: 15_000,
  });

  await page.reload();
  await expect(countInput).toBeEnabled({ timeout: 15_000 });
  await expect(countInput).toHaveValue("3");
});
