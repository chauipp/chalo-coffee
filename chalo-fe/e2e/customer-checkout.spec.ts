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
  await payCta.click();
  await expect(page.getByText("Phiên thanh toán gộp")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(/Hết hạn sau \d+:\d{2}/)).toBeVisible();

  // VietQR: with bank settings configured, the panel shows a scannable
  // bank-transfer QR locked to this table's total, plus the account holder.
  await expect(page.getByTestId("vietqr-code")).toBeVisible();
  await expect(page.getByText("CHALO COFFEE")).toBeVisible();

  const confirmCta = page.getByRole("button", { name: "✓ Tôi đã thanh toán" });
  await expect(confirmCta).toBeVisible();

  // --- settle everything (real POST /order/checkout/complete) ---
  await confirmCta.click();
  await expect(
    page.getByText("Đã thanh toán tất cả đơn của bàn"),
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByRole("button", { name: "Xem đơn hàng" }),
  ).toBeVisible();

  // The orders are now really paid: a fresh preview has no open orders left.
  const afterRes = await request.post(`${BE}/order/checkout/preview`, {
    data: { tableToken },
  });
  const afterOrders = (await afterRes.json()).data?.orders ?? [];
  expect(afterOrders.length).toBe(0);
});
