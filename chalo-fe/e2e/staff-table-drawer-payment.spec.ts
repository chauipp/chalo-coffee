import { expect, test, type Page } from "@playwright/test";

const ok = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ code: 200, message: "success", data }),
});

const staff = {
  id: 2,
  username: "staff",
  fullName: "Nhân viên",
  avatar: null,
  role: "MODERATOR",
  permissions: ["order:read", "order:write"],
};

const unpaidOrder = {
  id: "order-10",
  tableId: "table-10",
  tableName: "Bàn 10",
  tableToken: "qr-table-10",
  status: "COMPLETED",
  paidStatus: false,
  items: [],
  totalAmount: 29_000,
  estimateWaitMinutes: null,
  note: null,
  createdAt: "2026-08-12T13:00:00.000Z",
  updatedAt: "2026-08-12T13:00:00.000Z",
};

async function stubStaffTableApi(page: Page) {
  await page.route("**/api/auth/login", (route) =>
    route.fulfill(ok({ accessToken: "staff-token", refreshToken: "staff-refresh", user: staff })),
  );
  await page.route("**/api/auth/me", (route) => route.fulfill(ok(staff)));
  await page.route("**/api/order/active", (route) => route.fulfill(ok([])));
  await page.route("**/api/order/by-token/qr-table-10", (route) => route.fulfill(ok([unpaidOrder])));
  await page.route("**/api/table/list", (route) =>
    route.fulfill(ok([{
      id: "table-10",
      name: "Bàn 10",
      area: null,
      status: "OCCUPIED",
      qrToken: "qr-table-10",
      qrCodeUrl: "",
      // Bản tóm tắt có thể cũ ngay sau khi đơn chuyển trạng thái/thanh toán.
      // Drawer phải dựa vào truy vấn chi tiết đang tải chứ không được giấu CTA.
      activeOrders: [],
      createdAt: "2026-08-12T12:00:00.000Z",
    }])),
  );
}

test("drawer bàn hiện thanh toán cả bàn theo dữ liệu đơn chi tiết mới nhất", async ({ page }) => {
  await stubStaffTableApi(page);
  await page.goto("/login");
  await page.locator("#username").fill("staff");
  await page.locator("#password").fill("123456");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/staff/**");
  await page.goto("/staff/tables");

  await page.getByRole("button", { name: "Bàn 10" }).click();
  await expect(page.getByRole("button", { name: "Thanh toán cả bàn" })).toBeVisible();
  await expect(page.getByText("29.000đ")).toBeVisible();
});
