import { test, expect } from "@playwright/test";

// Exercises receipt printing against the live backend (no mocking): create a
// throwaway order via the API, open its detail modal in the staff UI, trigger
// the draft + final receipt print buttons (with window.print stubbed so the
// dialog never blocks the run), and assert the printable receipt DOM renders
// the order's line item + total.
const BE = "http://localhost:8080/api";

test("staff receipt prints line items + total (draft + final)", async ({
  page,
  request,
}) => {
  const loginRes = await request.post(`${BE}/auth/login`, {
    data: { username: "staff", password: "staff" },
  });
  const token = (await loginRes.json()).data.accessToken;
  const auth = { Authorization: `Bearer ${token}` };

  const tables = (
    await (await request.get(`${BE}/table/list`, { headers: auth })).json()
  ).data;
  const product = (
    await (
      await request.get(`${BE}/menu/product/simple-list`, { headers: auth })
    ).json()
  ).data[0];

  const createRes = await request.post(`${BE}/order/create`, {
    headers: auth,
    data: {
      tableToken: tables[0].qrToken,
      note: "E2E_RECEIPT_THROWAWAY",
      items: [{ productId: product.id, quantity: 2 }],
    },
  });
  expect(createRes.ok()).toBeTruthy();
  const order = (await createRes.json()).data;
  const shortId = order.id.slice(-6).toUpperCase();

  try {
    // Stub window.print on every document so the print dialog never blocks.
    await page.addInitScript(() => {
      window.print = () => {};
    });

    await page.goto("/login");
    await page.locator("#username").fill("staff");
    await page.locator("#password").fill("staff");
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await page.waitForURL("**/staff/**");

    // Open the active-orders board and click our throwaway order's card
    // (soft-nav opens the intercepted detail modal).
    await page.goto("/staff/orders");
    await page.getByText(`#${shortId}`).click();

    await expect(
      page.getByRole("heading", { name: "Chi tiết đơn hàng" }),
    ).toBeVisible({ timeout: 15_000 });

    const receipt = page.getByTestId("receipt-root");

    // Final receipt.
    await page.getByRole("button", { name: /In hoá đơn/ }).click();
    await expect(receipt).toContainText("HOÁ ĐƠN THANH TOÁN");
    await expect(receipt).toContainText(product.name); // line item
    await expect(receipt).toContainText("TỔNG CỘNG"); // total row

    // Draft (unpaid order shows the "In tạm tính" button).
    await page.getByRole("button", { name: /In tạm tính/ }).click();
    await expect(receipt).toContainText("PHIẾU TẠM TÍNH");
    await expect(receipt).toContainText(product.name);
  } finally {
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
