import { test, expect } from "@playwright/test";

// Regression test for a bug where the orders page's "Đã thanh toán" summary
// line summed ALL orders' totalAmount instead of only paid ones (it filtered
// on `o.status`, which is always truthy, instead of `o.paidStatus`).
const BE = "http://localhost:8080/api";

test("orders page paid-total only counts orders with paidStatus true", async ({
  page,
  request,
}) => {
  const login = await request.post(`${BE}/auth/login`, {
    data: { username: "admin", password: "admin" },
  });
  const adminToken = (await login.json()).data.accessToken;
  const auth = { Authorization: `Bearer ${adminToken}` };

  const tablesRes = await request.get(`${BE}/table/list`, { headers: auth });
  const tableToken: string = (await tablesRes.json()).data[0].qrToken;

  const prodRes = await request.get(`${BE}/menu/product/simple-list`, {
    headers: auth,
  });
  const productId: string = (await prodRes.json()).data[0].id;

  // Create two fresh orders on the table: one we'll pay, one we'll leave open.
  const paidOrderRes = await request.post(`${BE}/order/create`, {
    data: { tableToken, items: [{ productId, quantity: 2 }] },
  });
  expect(paidOrderRes.status()).toBe(201);
  const paidOrder = (await paidOrderRes.json()).data;

  const unpaidOrderRes = await request.post(`${BE}/order/create`, {
    data: { tableToken, items: [{ productId, quantity: 1 }] },
  });
  expect(unpaidOrderRes.status()).toBe(201);

  // Mark only the first order as paid (public endpoint, no auth needed).
  const payRes = await request.post(`${BE}/order/pay`, {
    data: { orderId: paidOrder.id },
  });
  expect(payRes.ok()).toBeTruthy();

  // Ground truth: sum totalAmount of every order on this table with
  // paidStatus true, using the same public endpoint the page reads from.
  const afterRes = await request.get(`${BE}/order/by-token/${tableToken}`);
  const allOrders = (await afterRes.json()).data;
  const expectedPaidTotal = allOrders
    .filter((o: { paidStatus: boolean }) => o.paidStatus)
    .reduce(
      (sum: number, o: { totalAmount: number }) => sum + o.totalAmount,
      0,
    );
  const grandTotal = allOrders.reduce(
    (sum: number, o: { totalAmount: number }) => sum + o.totalAmount,
    0,
  );
  // Sanity check the test setup actually creates a paid/unpaid split -
  // otherwise this test can't distinguish correct from buggy behavior.
  expect(expectedPaidTotal).toBeLessThan(grandTotal);

  await page.goto(`/menu/${tableToken}/orders`);
  const paidRow = page.locator("div.flex.justify-between.text-sm", {
    hasText: "Đã thanh toán",
  });
  await expect(paidRow).toBeVisible({ timeout: 15_000 });
  const amountText = await paidRow.locator("span.font-medium").textContent();
  const paidDigits = (amountText ?? "").replace(/\D/g, "");
  expect(Number(paidDigits)).toBe(expectedPaidTotal);
});
