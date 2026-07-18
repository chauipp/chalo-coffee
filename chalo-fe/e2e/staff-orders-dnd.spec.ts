import { test, expect, Page } from "@playwright/test";
import type { OrderDto } from "../src/services/order/order.types";

// Kéo thả trên màn Đơn hàng staff. Test tự chứa: stub auth + /order/active +
// /order/status bằng page.route nên KHÔNG cần BE, không mutate DB, và không
// dính filter "đơn hôm nay" của BE (bảng staff rỗng sau 0h VN).

const ok = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ code: 200, message: "success", data }),
});

const makeOrder = (
  id: string,
  tableName: string,
  status: OrderDto["status"],
): OrderDto => ({
  id,
  tableId: `tbl-${id}`,
  tableName,
  tableToken: `qr-${id}`,
  status,
  paidStatus: false,
  items: [
    {
      id: `item-${id}`,
      productId: "prod-1",
      productName: "Cà phê đen đá",
      productImageUrl: null,
      price: 25000,
      quantity: 1,
      preparedQuantity: 0,
      subtotal: 25000,
      note: null,
    },
  ],
  totalAmount: 25000,
  estimateWaitMinutes: 5,
  note: null,
  createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  updatedAt: new Date().toISOString(),
});

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

/** Stub API: trạng thái đơn nằm trong closure, PUT /order/status mutate nó. */
async function stubApi(page: Page, orders: OrderDto[]) {
  await page.route("**/api/auth/login", (route) =>
    route.fulfill(ok(staffAccount)),
  );
  await page.route("**/api/auth/me", (route) =>
    route.fulfill(ok(staffAccount.user)),
  );
  await page.route("**/api/order/active", (route) =>
    route.fulfill(
      ok(
        orders.filter(
          (o) => o.status !== "COMPLETED" || !o.paidStatus,
        ),
      ),
    ),
  );
  await page.route("**/api/order/status", async (route) => {
    const body = route.request().postDataJSON() as {
      id: string;
      status: OrderDto["status"];
    };
    const order = orders.find((o) => o.id === body.id);
    if (!order) return route.fulfill({ status: 404, body: "{}" });
    order.status = body.status;
    await route.fulfill(ok(order));
  });
}

async function loginUI(page: Page) {
  await page.goto("/login");
  await page.locator("#username").fill("staff");
  await page.locator("#password").fill("staff");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/staff/**");
}

test("kéo card Khách đặt vào khu pha chế → PREPARING, kéo card READY sang Đã phục vụ → COMPLETED", async ({
  page,
}) => {
  const orders = [
    makeOrder("ord-pending", "Bàn 91", "PENDING"),
    makeOrder("ord-ready", "Bàn 92", "READY"),
  ];
  await stubApi(page, orders);
  await loginUI(page);
  await page.goto("/staff/orders");

  const pendingCard = page.locator('div[role="button"]', {
    hasText: "Bàn 91",
  });
  const readyCard = page.locator('div[role="button"]', { hasText: "Bàn 92" });
  await expect(pendingCard).toBeVisible({ timeout: 15_000 });
  await expect(readyCard).toBeVisible();

  // Thả sai chỗ: card "Khách đặt" thả vào cột "Đã phục vụ" → không nhận,
  // trạng thái giữ nguyên (đích hợp lệ duy nhất của PENDING là khu pha chế)
  await pendingCard.dragTo(
    page.locator("span.text-sm.font-bold", { hasText: "Đã phục vụ" }),
  );
  await expect(pendingCard).toBeVisible();
  expect(orders[0].status).toBe("PENDING");

  // Thả đúng: vào khu "Đang pha chế" = Bắt đầu pha → PREPARING rời 3 cột
  // trái, món hiện trong khu pha chế
  await pendingCard.dragTo(page.getByRole("heading", { name: "Đang pha chế" }));
  await expect(pendingCard).toBeHidden({ timeout: 15_000 });
  expect(orders[0].status).toBe("PREPARING");
  await expect(
    page.locator('[data-testid^="prep-product-"]').first(),
  ).toBeVisible();

  // Card READY kéo sang "Đã phục vụ" = Đã bê ra → COMPLETED, card vẫn hiển
  // thị (chưa thanh toán) nhưng hết nút hành động
  await expect(readyCard.locator("button", { hasText: "Đã bê ra" })).toBeVisible();
  await readyCard.dragTo(
    page.locator("span.text-sm.font-bold", { hasText: "Đã phục vụ" }),
  );
  await expect(
    readyCard.locator("button", { hasText: "Đã bê ra" }),
  ).toBeHidden({ timeout: 15_000 });
  expect(orders[1].status).toBe("COMPLETED");
  await expect(readyCard).toBeVisible();
});
