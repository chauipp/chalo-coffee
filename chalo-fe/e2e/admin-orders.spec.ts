import { test, expect } from "@playwright/test";

// Exercises the real Orders (Đơn hàng) admin page against the live backend
// (no mocking): log in as admin, navigate via the real sidebar link, assert
// the paginated order list renders real rows, that pagination advances, and
// that filtering narrows the result set (a future date yields the empty state,
// and clearing the filter brings the rows back).
test("admin orders page renders rows, paginates and filters", async ({
  page,
}) => {
  // 1. Log in.
  await page.goto("/login");
  await page.locator("#username").fill("admin");
  await page.locator("#password").fill("admin");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin/dashboard");

  // 2. Navigate to Orders via the real sidebar link.
  await page.getByRole("link", { name: "Đơn hàng" }).click();
  await page.waitForURL("**/admin/orders");
  await expect(page.getByRole("heading", { name: "Đơn hàng" })).toBeVisible();

  // 3. Real order rows render (short id "#xxxxxxxx") + positive footer total.
  await expect(page.getByText(/^#[0-9a-f]{8}$/).first()).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(/Tổng:\s*\d+\s*bản ghi/)).toBeVisible();

  // 4. Pagination advances (default 20/page over ~250 orders -> many pages).
  await expect(page.getByText(/^1 \/ \d+$/)).toBeVisible();
  await page.getByRole("button", { name: "Sau →" }).click();
  await expect(page.getByText(/^2 \/ \d+$/)).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "← Trước" }).click();
  await expect(page.getByText(/^1 \/ \d+$/)).toBeVisible();

  // 5. Filter by a future date -> no orders -> empty state.
  await page.locator('input[type="date"]').fill("2035-01-01");
  await expect(page.getByText("Không có đơn hàng nào.")).toBeVisible({
    timeout: 15_000,
  });

  // 6. Clear the filter -> rows return.
  await page.getByRole("button", { name: "Xoá bộ lọc" }).click();
  await expect(page.getByText(/^#[0-9a-f]{8}$/).first()).toBeVisible({
    timeout: 15_000,
  });
});
