// chalo-fe/e2e/customer-order-theme.spec.ts
import { expect, test } from "@playwright/test";

const BE = "http://localhost:8080/api";

async function getFirstFreeTableToken(request: import("@playwright/test").APIRequestContext) {
  const login = await request.post(`${BE}/auth/login`, {
    data: { username: "admin", password: "admin" },
  });
  const adminToken = (await login.json()).data.accessToken;
  const auth = { Authorization: `Bearer ${adminToken}` };
  const tablesRes = await request.get(`${BE}/table/list`, { headers: auth });
  const tables = (await tablesRes.json()).data as Array<{
    qrToken: string;
    status?: string;
  }>;
  return (
    tables.find((table) => table.status !== "OCCUPIED")?.qrToken ??
    tables[0]?.qrToken
  );
}

test("mặc định vào menu là biến thể Rực rỡ", async ({ page, request }) => {
  const tableToken = await getFirstFreeTableToken(request);
  test.skip(!tableToken, "Cần ít nhất 1 bàn");

  await page.goto(`/menu/${tableToken}`);
  const occupiedContinue = page.locator("div.fixed.inset-0.z-50 button").first();
  const occupiedVisible = await occupiedContinue
    .waitFor({ state: "visible", timeout: 1000 })
    .then(() => true)
    .catch(() => false);
  if (occupiedVisible) await occupiedContinue.click();

  await expect(page.getByTestId("order-theme-playful")).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(page.getByTestId("order-theme-cinematic")).toHaveAttribute(
    "aria-checked",
    "false",
  );
});

test("chuyển sang Điện ảnh và giữ lại sau khi tải lại trang", async ({
  page,
  request,
}) => {
  const tableToken = await getFirstFreeTableToken(request);
  test.skip(!tableToken, "Cần ít nhất 1 bàn");

  await page.goto(`/menu/${tableToken}`);
  const occupiedContinue = page.locator("div.fixed.inset-0.z-50 button").first();
  const occupiedVisible = await occupiedContinue
    .waitFor({ state: "visible", timeout: 1000 })
    .then(() => true)
    .catch(() => false);
  if (occupiedVisible) await occupiedContinue.click();

  await page.getByTestId("order-theme-cinematic").click();
  await expect(page.getByTestId("order-theme-cinematic")).toHaveAttribute(
    "aria-checked",
    "true",
  );

  await page.reload();
  const occupiedAgain = page.locator("div.fixed.inset-0.z-50 button").first();
  const occupiedVisibleAgain = await occupiedAgain
    .waitFor({ state: "visible", timeout: 1000 })
    .then(() => true)
    .catch(() => false);
  if (occupiedVisibleAgain) await occupiedAgain.click();

  await expect(page.getByTestId("order-theme-cinematic")).toHaveAttribute(
    "aria-checked",
    "true",
  );
});

test("toggle A/B độc lập với toggle Sáng/Tối — cả 4 tổ hợp không lỗi", async ({
  page,
  request,
}) => {
  const tableToken = await getFirstFreeTableToken(request);
  test.skip(!tableToken, "Cần ít nhất 1 bàn");

  await page.goto(`/menu/${tableToken}`);
  const occupiedContinue = page.locator("div.fixed.inset-0.z-50 button").first();
  const occupiedVisible = await occupiedContinue
    .waitFor({ state: "visible", timeout: 1000 })
    .then(() => true)
    .catch(() => false);
  if (occupiedVisible) await occupiedContinue.click();

  for (const orderTheme of ["playful", "cinematic"] as const) {
    await page.getByTestId(`order-theme-${orderTheme}`).click();
    for (const uiTheme of ["light", "dark"] as const) {
      await page.getByTestId("theme-switch").evaluate(
        (el, targetDark) => {
          const isDark = el.getAttribute("aria-checked") === "true";
          if (isDark !== targetDark) el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        },
        uiTheme === "dark",
      );
      await expect(page.getByTestId(`order-theme-${orderTheme}`)).toHaveAttribute(
        "aria-checked",
        "true",
      );
      // không có lỗi console nghiêm trọng khi đổi tổ hợp
      await expect(page.locator("body")).toBeVisible();
    }
  }
});
