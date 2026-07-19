import { test, expect } from "@playwright/test";

// Trạm in: thanh toán hoàn tất (bất kể nguồn) → trang tự render hoá đơn gộp
// và gọi window.print đúng 1 lần; "In lại" hoạt động. Chạy với BE thật.
const BE = "http://localhost:8080/api";

test("trạm in tự in hoá đơn khi thanh toán hoàn tất + in lại được", async ({
  page,
  request,
}) => {
  const login = await request.post(`${BE}/auth/login`, {
    data: { username: "staff", password: "staff" },
  });
  const token = (await login.json()).data.accessToken;
  const auth = { Authorization: `Bearer ${token}` };

  const tables = (
    await (await request.get(`${BE}/table/list`, { headers: auth })).json()
  ).data;
  const tableToken: string = tables[0].qrToken;
  const product = (
    await (
      await request.get(`${BE}/menu/product/simple-list`, { headers: auth })
    ).json()
  ).data[0];

  // Đếm số lần window.print được gọi thay vì mở hộp thoại thật
  await page.addInitScript(() => {
    (window as unknown as { __printCount: number }).__printCount = 0;
    window.print = () => {
      (window as unknown as { __printCount: number }).__printCount += 1;
    };
  });

  await page.goto("/login");
  await page.locator("#username").fill("staff");
  await page.locator("#password").fill("staff");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/staff/**");
  await page.goto("/staff/print-station");
  await expect(page.getByText("Trạm in hoá đơn")).toBeVisible();
  await expect(page.getByText("Đang nghe thanh toán")).toBeVisible({
    timeout: 15_000,
  });

  // Tạo đơn + phiên + thu ngân xác nhận (SAU khi trạm đã mở để nhận SSE)
  const created = await request.post(`${BE}/order/create`, {
    data: {
      tableToken,
      note: "E2E_PRINT_STATION",
      items: [{ productId: product.id, quantity: 2 }],
    },
  });
  expect(created.status()).toBe(201);
  const order = (await created.json()).data;

  try {
    const startRes = await request.post(`${BE}/order/checkout/start`, {
      data: { tableToken, orderIds: [order.id] },
    });
    const session = (await startRes.json()).data;

    const completeRes = await request.post(
      `${BE}/order/checkout/complete-staff`,
      { headers: auth, data: { sessionId: session.sessionId } },
    );
    expect(completeRes.ok()).toBeTruthy();

    // Hoá đơn render + in đúng 1 lần
    const receipt = page.getByTestId("payment-receipt-root");
    await expect(receipt).toContainText(product.name, { timeout: 15_000 });
    await expect(receipt).toContainText("TỔNG CỘNG");
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as { __printCount: number }).__printCount,
        ),
      )
      .toBe(1);

    // In lại từ lịch sử
    await page.getByRole("button", { name: "In lại" }).first().click();
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as { __printCount: number }).__printCount,
        ),
      )
      .toBe(2);
  } finally {
    // Dọn: huỷ đơn throwaway để không rác board
    try {
      await request.put(`${BE}/order/status`, {
        headers: auth,
        data: { id: order.id, status: "CANCELLED" },
      });
    } catch {
      // ignore
    }
  }
});
