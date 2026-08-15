import { expect, test } from "@playwright/test";

const order = {
  id: "order-operations-1",
  tableId: "table-1",
  tableName: "Bàn 1",
  tableToken: "token-1",
  status: "PENDING",
  paidStatus: false,
  items: [],
  totalAmount: 42000,
  createdAt: "2026-08-14T13:00:00.000Z",
  updatedAt: "2026-08-14T13:00:00.000Z",
};

const ok = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ code: 200, message: "success", data }),
});

test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/me", (route) =>
    route.fulfill(ok({ id: 1, username: "admin", role: "ADMIN", permissions: ["*"] })),
  );
  await page.route("**/api/order/active**", (route) => route.fulfill(ok([order])));
  await page.route("**/api/order/page**", (route) =>
    route.fulfill(ok({ list: [order], total: 1 })),
  );
  await page.route("**/api/table**", (route) => route.fulfill(ok([])));
});

test("admin orders mặc định mở bảng vận hành realtime", async ({ page }) => {
  await page.goto("/admin/orders");
  await expect(page.getByText(/Bảng vận hành realtime/)).toBeVisible();
  await expect(page.getByText(/Real-time/)).toBeVisible();
  await expect(page.getByRole("tab", { name: "Vận hành" })).toHaveAttribute("aria-selected", "true");
});

test("admin chuyển sang lịch sử vẫn giữ bộ lọc và bảng dữ liệu", async ({ page }) => {
  await page.goto("/admin/orders");
  await page.getByRole("tab", { name: "Lịch sử" }).click();
  await expect(page).toHaveURL(/\/admin\/orders\?view=history/);
  await expect(page.getByText("Toàn bộ đơn hàng của quán")).toBeVisible();
  await expect(page.getByText("Không có đơn hàng nào.")).toHaveCount(0);
  const dateFilter = page.locator('input[type="date"]');
  await expect(dateFilter).toBeVisible();
  await dateFilter.fill("2026-08-14");
  await expect(dateFilter).toHaveValue("2026-08-14");
  await expect(page.getByRole("button", { name: "Xóa" }).first()).toBeVisible();

  await page.getByRole("tab", { name: "Vận hành" }).click();
  await expect(page).toHaveURL(/\/admin\/orders\?view=operations/);
  await page.getByRole("tab", { name: "Lịch sử" }).click();
  await expect(page).toHaveURL(/\/admin\/orders\?view=history/);
  await expect(dateFilter).toHaveValue("2026-08-14");
});
