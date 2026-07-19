import { test, expect } from "@playwright/test";

// Exercises the real batch-checkout ("scan once, pay all") flow against the
// live backend (no mocking): the customer visits a table's checkout page, the
// preview lists the table's open orders + grand total, and tapping the CTA
// opens a real pay-all session (POST /order/checkout/start) with a live
// countdown.
const BE = "http://localhost:8080/api";

test("checkout previews open orders and opens a pay-all session", async ({
  page,
  request,
}) => {
  // --- setup: guarantee the chosen table has at least one open order ---
  const login = await request.post(`${BE}/auth/login`, {
    data: { username: "admin", password: "admin" },
  });
  const adminToken = (await login.json()).data.accessToken;
  const auth = { Authorization: `Bearer ${adminToken}` };

  const tablesRes = await request.get(`${BE}/table/list`, { headers: auth });
  const tableToken: string = (await tablesRes.json()).data[0].qrToken;

  // Configure VietQR bank settings so the session step renders the payment QR.
  const settingsRes = await request.put(`${BE}/settings`, {
    headers: auth,
    data: {
      bankBin: "970422",
      bankAccountNo: "0123456789",
      bankAccountName: "CHALO COFFEE",
    },
  });
  expect(settingsRes.ok()).toBeTruthy();

  const prodRes = await request.get(`${BE}/menu/product/simple-list`, {
    headers: auth,
  });
  const productId: string = (await prodRes.json()).data[0].id;

  // Public endpoint — seeds a fresh unpaid order so the checkout path is real.
  const created = await request.post(`${BE}/order/create`, {
    data: { tableToken, items: [{ productId, quantity: 2 }] },
  });
  expect(created.status()).toBe(201);

  const previewRes = await request.post(`${BE}/order/checkout/preview`, {
    data: { tableToken },
  });
  const preview = (await previewRes.json()).data;
  expect(preview.orders.length).toBeGreaterThan(0);
  const total: number = preview.totalAmount;

  // --- UI: review step lists the open orders + grand total ---
  await page.goto(`/menu/${tableToken}/checkout`);
  await expect(
    page.getByText(`${preview.orders.length} đơn sẽ được thanh toán`),
  ).toBeVisible({ timeout: 15_000 });

  const payCta = page.getByRole("button", { name: /Thanh toán/ });
  await expect(payCta).toBeVisible();
  // The CTA total must equal the live preview total (separator-agnostic).
  const ctaDigits = ((await payCta.textContent()) ?? "").replace(/\D/g, "");
  expect(Number(ctaDigits)).toBe(total);

  // --- open the pay-all session (real POST /order/checkout/start) ---
  const startResPromise = page.waitForResponse(
    (r) => r.url().includes("/order/checkout/start") && r.ok(),
  );
  await payCta.click();
  await expect(page.getByText("Phiên thanh toán gộp")).toBeVisible({
    timeout: 15_000,
  });
  const session = (await (await startResPromise).json()).data;
  expect(session.payCode).toMatch(/^CK[A-HJKMNP-Z2-9]{6}$/);

  await expect(page.getByText(/Hết hạn sau \d+:\d{2}/)).toBeVisible();

  // VietQR khoá số tiền + nội dung CK = payCode do BE sinh
  await expect(page.getByTestId("vietqr-code")).toBeVisible();
  await expect(page.getByText("CHALO COFFEE")).toBeVisible();
  await expect(page.getByText(session.payCode)).toBeVisible();

  // Không còn nút tự khai — thay bằng trạng thái chờ ngân hàng xác nhận
  await expect(page.getByTestId("awaiting-bank")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "✓ Tôi đã thanh toán" }),
  ).toHaveCount(0);

  // --- thu ngân xác nhận (JWT) → SSE đẩy màn khách sang trạng thái xong ---
  const completeRes = await request.post(
    `${BE}/order/checkout/complete-staff`,
    { headers: auth, data: { sessionId: session.sessionId } },
  );
  expect(completeRes.ok()).toBeTruthy();

  await expect(
    page.getByText("Đã thanh toán tất cả đơn của bàn"),
  ).toBeVisible({ timeout: 15_000 });

  // Các đơn đã thật sự được trả: preview mới không còn đơn mở nào
  const afterRes = await request.post(`${BE}/order/checkout/preview`, {
    data: { tableToken },
  });
  const afterOrders = (await afterRes.json()).data?.orders ?? [];
  expect(afterOrders.length).toBe(0);
});
