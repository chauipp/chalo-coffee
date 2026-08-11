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

const table = {
  id: "table-01",
  name: "Bàn 01",
  area: "Tầng 1",
  status: "OCCUPIED" as const,
  qrToken: "qr-table-01",
  qrCodeUrl: "",
  createdAt: "2026-08-01T00:00:00.000Z",
  activeOrders: [
    {
      id: "order-01",
      status: "COMPLETED" as const,
      paidStatus: false,
      totalAmount: 120_000,
      createdAt: "2026-08-01T00:00:00.000Z",
    },
  ],
};

async function stubStaffTableApi(page: Page, onPayAll: (body: unknown) => void) {
  await page.route("**/api/auth/login", (route) =>
    route.fulfill(
      ok({ accessToken: "staff-token", refreshToken: "staff-refresh", user: staff }),
    ),
  );
  await page.route("**/api/auth/me", (route) => route.fulfill(ok(staff)));
  await page.route("**/api/table/list", (route) => route.fulfill(ok([table])));
  await page.route("**/api/settings", (route) =>
    route.fulfill(
      ok({
        waitTimeEnabled: true,
        baristaCount: 1,
        bankBin: "970422",
        bankAccountNo: "0123456789",
        bankAccountName: "CHALO COFFEE",
      }),
    ),
  );
  await page.route("**/api/order/active", (route) => route.fulfill(ok([])));
  await page.route("**/api/order/pay-all", async (route) => {
    onPayAll(route.request().postDataJSON());
    await route.fulfill(ok([]));
  });
}

test("staff thấy QR và tiền thừa trước khi thanh toán gộp bàn", async ({ page }) => {
  let payAllBody: unknown = null;
  await stubStaffTableApi(page, (body) => (payAllBody = body));

  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/login");
  await page.locator("#username").fill("staff");
  await page.locator("#password").fill("123456");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/staff/**");
  await page.goto("/staff/tables");

  await page.getByRole("button", { name: /Bàn 01/ }).click();
  await page.getByRole("button", { name: "Thanh toán" }).click();
  await expect(page.getByTestId("vietqr-code")).toBeVisible();

  await page.getByRole("radio", { name: /Tiền mặt/ }).click();
  const received = page.getByRole("textbox", { name: "Tiền khách đưa" });
  await received.fill("150000");
  await expect(page.getByText("30.000đ")).toBeVisible();
  await page.getByRole("button", { name: "Xác nhận đã thanh toán" }).click();

  await expect(page.getByRole("dialog", { name: "Thanh toán Bàn 01" })).toBeHidden();
  expect(payAllBody).toEqual({ tableToken: "qr-table-01" });
});
