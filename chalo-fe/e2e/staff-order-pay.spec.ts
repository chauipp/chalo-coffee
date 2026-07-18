import { test, expect, Page } from "@playwright/test";
import type { OrderDto } from "../src/services/order/order.types";

// Đánh dấu đã thanh toán từ modal chi tiết đơn. Test tự chứa: stub auth +
// order active/detail/pay + pager list bằng page.route → KHÔNG cần BE, không
// mutate DB, không dính filter "đơn hôm nay".

const ok = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ code: 200, message: "success", data }),
});

const order: OrderDto = {
  id: "5c613214-203c-48e2-bfda-59c6418c3e3b",
  tableId: "tbl-10",
  tableName: "Bàn 10",
  tableToken: "qr-tbl-10",
  status: "READY",
  paidStatus: false,
  items: [
    {
      id: "item-1",
      productId: "prod-1",
      productName: "Chalo Coffee Đen Nâu",
      productImageUrl: null,
      price: 29000,
      quantity: 2,
      preparedQuantity: 2,
      subtotal: 58000,
      note: null,
    },
  ],
  totalAmount: 58000,
  estimateWaitMinutes: null,
  note: null,
  createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  updatedAt: new Date().toISOString(),
};

const staffAccount = {
  accessToken: "mock-access-token-staff",
  refreshToken: "mock-refresh-token-staff",
  user: {
    id: 2,
    username: "staff",
    fullName: "Trần Thị Nhân Viên",
    avatar: null,
    role: "MODERATOR",
    permissions: ["order:write", "order:read"],
  },
};

async function stubApi(page: Page, onPay: (body: unknown) => void) {
  await page.route("**/api/auth/login", (r) => r.fulfill(ok(staffAccount)));
  await page.route("**/api/auth/me", (r) => r.fulfill(ok(staffAccount.user)));
  await page.route("**/api/pager/list**", (r) => r.fulfill(ok([])));
  await page.route("**/api/order/active", (r) =>
    r.fulfill(ok(order.paidStatus && order.status === "COMPLETED" ? [] : [order])),
  );
  await page.route("**/api/order/detail**", (r) => r.fulfill(ok(order)));
  await page.route("**/api/order/pay", async (route) => {
    onPay(route.request().postDataJSON());
    order.paidStatus = true;
    await route.fulfill(
      ok({ orderId: order.id, paidStatus: true, message: "ok" }),
    );
  });
}

test("mở modal chi tiết đơn rồi bấm Đã thanh toán → gọi /order/pay đúng payload", async ({
  page,
}) => {
  let payBody: unknown = null;
  await stubApi(page, (b) => (payBody = b));

  await page.goto("/login");
  await page.locator("#username").fill("staff");
  await page.locator("#password").fill("staff");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/staff/**");
  await page.goto("/staff/orders");

  // Mở modal bằng cách click card của Bàn 10
  await page.locator('div[role="button"]', { hasText: "Bàn 10" }).click();
  const modal = page.getByRole("heading", { name: "Chi tiết đơn hàng" });
  await expect(modal).toBeVisible({ timeout: 15_000 });

  // Nút Đã thanh toán hiển thị (đơn chưa trả tiền)
  const payBtn = page.getByRole("button", { name: /Đã thanh toán/ });
  await expect(payBtn).toBeVisible();
  await payBtn.click();

  // Modal đóng lại sau khi thanh toán
  await expect(modal).toBeHidden({ timeout: 15_000 });

  // Gọi đúng endpoint với orderId + tableToken
  expect(payBody).toEqual({
    orderId: order.id,
    tableToken: order.tableToken,
  });
});
