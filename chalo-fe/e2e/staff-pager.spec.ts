import { test, expect } from "@playwright/test";

// Exercises the real pager (thẻ bàn) lifecycle against the live backend (no
// mocking). Assign happens through the app's order-creation path — here we
// create a throwaway order WITH a pager via the API (allowed), then drive the
// POS pager board UI to assert ASSIGNED (Đang pha) -> call -> WAITING (Sẵn
// sàng) -> release -> COMPLETED (card leaves the board).
const BE = "http://localhost:8080/api";

test("staff pager board: ASSIGNED -> call WAITING -> release COMPLETED", async ({
  page,
  request,
}) => {
  // API auth for setup + cleanup.
  const loginRes = await request.post(`${BE}/auth/login`, {
    data: { username: "staff", password: "staff" },
  });
  const token = (await loginRes.json()).data.accessToken;
  const auth = { Authorization: `Bearer ${token}` };

  // High, per-run-varied number so concurrent/repeat runs don't collide on the
  // "Thẻ bàn #<n> đang được sử dụng" 400.
  const pagerNo = 700 + Math.floor(Math.random() * 299); // 700–998

  const tables = (
    await (await request.get(`${BE}/table/list`, { headers: auth })).json()
  ).data;
  const product = (
    await (
      await request.get(`${BE}/menu/product/simple-list`, { headers: auth })
    ).json()
  ).data[0];

  // Create a throwaway order carrying the pager (BE assigns it as ASSIGNED).
  const createRes = await request.post(`${BE}/order/create`, {
    headers: auth,
    data: {
      tableToken: tables[0].qrToken,
      note: "E2E_PAGER_THROWAWAY",
      pagerNumber: pagerNo,
      items: [{ productId: product.id, quantity: 1 }],
    },
  });
  expect(createRes.ok()).toBeTruthy();
  const order = (await createRes.json()).data;
  const pagerId: string = order.pagerId;
  expect(order.pagerNumber).toBe(pagerNo);

  try {
    // Log in through the UI.
    await page.goto("/login");
    await page.locator("#username").fill("staff");
    await page.locator("#password").fill("staff");
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await page.waitForURL("**/staff/**");

    // Open the POS pager board.
    await page.goto("/staff/pos");
    await page.getByRole("button", { name: /Thẻ bàn/ }).click();

    const card = page.getByTestId(`pager-${pagerNo}`);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card).toHaveAttribute("data-status", "ASSIGNED");
    await expect(card).toContainText("Đang pha");

    // call -> WAITING
    await card.getByRole("button", { name: /Gọi/ }).click();
    await expect(card).toHaveAttribute("data-status", "WAITING", {
      timeout: 15_000,
    });
    await expect(card).toContainText("Sẵn sàng");

    // release -> COMPLETED -> card leaves the board
    await card.getByRole("button", { name: "Thu thẻ" }).click();
    await expect(page.getByTestId(`pager-${pagerNo}`)).toHaveCount(0, {
      timeout: 15_000,
    });
  } finally {
    // Best-effort cleanup so re-runs never collide and no active row lingers.
    try {
      await request.post(`${BE}/pager/release`, {
        headers: auth,
        data: { id: pagerId },
      });
      await request.put(`${BE}/order/status`, {
        headers: auth,
        data: { id: order.id, status: "CANCELLED" },
      });
    } catch {
      // ignore
    }
  }
});
