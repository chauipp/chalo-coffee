import { test, expect } from "@playwright/test";

// Exercises the real Staff (Nhân viên) admin page against the live backend
// (no mocking): log in as admin/admin, navigate via the real sidebar link,
// assert the seeded user list renders, then create a UNIQUE throwaway staff
// account and assert it appears in the list.
//
// NOTE: this writes a real user row to the shared DB with the identifiable
// prefix "e2e_staff_" so it can be found and cleaned up later.
test("admin lists users and creates a new staff account", async ({ page }) => {
  // 1. Log in through the real login form.
  await page.goto("/login");
  await page.locator("#username").fill("admin");
  await page.locator("#password").fill("admin");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin/dashboard");

  // 2. Navigate to the Staff page via the real sidebar link (no 404).
  await page.getByRole("link", { name: "Nhân viên" }).click();
  await page.waitForURL("**/admin/staff");
  await expect(
    page.getByRole("heading", { name: "Nhân viên" }),
  ).toBeVisible();

  // 3. The seeded user list renders real rows: at least one "@username" cell
  //    and a positive total in the pagination footer.
  await expect(page.getByText(/^@\w+/).first()).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(/Tổng:\s*\d+\s*bản ghi/)).toBeVisible();

  // 4. Create a UNIQUE throwaway staff account.
  const username = `e2e_staff_${Date.now()}`;
  await page.getByRole("button", { name: "+ Thêm nhân viên" }).click();

  const modal = page.locator("form");
  await modal.locator('input[name="username"]').fill(username);
  await modal.locator('input[name="password"]').fill("secret123");
  await modal.locator('input[name="fullName"]').fill("E2E Staff Bot");
  // role select defaults to MODERATOR, isActive toggle defaults to on.
  await page.getByRole("button", { name: "Tạo mới" }).click();

  // 5. Success toast + the new row appears at the top of the (id-desc) list.
  await expect(page.getByText("Thêm nhân viên thành công")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(`@${username}`)).toBeVisible({ timeout: 15_000 });
});
