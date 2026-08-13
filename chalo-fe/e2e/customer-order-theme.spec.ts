// chalo-fe/e2e/customer-order-theme.spec.ts
import { expect, test, type Page } from "@playwright/test";

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

// Trả về một sản phẩm khả dụng, ưu tiên loại KHÔNG có modifier (để đảm bảo
// nút "+" của biến thể Cinematic gọi quickAdd() trực tiếp thay vì mở modal).
async function getAvailableProduct(request: import("@playwright/test").APIRequestContext) {
  const login = await request.post(`${BE}/auth/login`, {
    data: { username: "admin", password: "admin" },
  });
  const adminToken = (await login.json()).data.accessToken;
  const auth = { Authorization: `Bearer ${adminToken}` };
  const productsRes = await request.get(`${BE}/menu/product/list`, {
    headers: auth,
  });
  const products = (await productsRes.json()).data as Array<{
    id: string;
    name: string;
    isActive: boolean;
    status: string;
    modifierGroups?: unknown[];
  }>;
  const available = products.filter(
    (p) => p.isActive && p.status === "AVAILABLE",
  );
  const withoutModifiers = available.find(
    (p) => (p.modifierGroups?.length ?? 0) === 0,
  );
  return withoutModifiers ?? available[0];
}

function trackPageFailures(page: Page) {
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && response.url().includes("/api/")) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });
  return { consoleErrors, failedResponses };
}

async function dismissOccupiedModal(page: Page) {
  const occupiedContinue = page.locator("div.fixed.inset-0.z-50 button").first();
  const occupiedVisible = await occupiedContinue
    .waitFor({ state: "visible", timeout: 1000 })
    .then(() => true)
    .catch(() => false);
  if (occupiedVisible) await occupiedContinue.click();
}

test("menu dùng một giao diện và thêm nhanh 1 món vào giỏ hàng", async ({
  page,
  request,
}) => {
  const failures = trackPageFailures(page);
  const tableToken = await getFirstFreeTableToken(request);
  const targetProduct = await getAvailableProduct(request);
  test.skip(!tableToken || !targetProduct, "Cần ít nhất 1 bàn và 1 món khả dụng");

  await page.goto(`/menu/${tableToken}`);
  await dismissOccupiedModal(page);

  const card = page.getByTestId(`product-card-${targetProduct!.id}`);
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card
    .getByRole("button", { name: `Thêm nhanh ${targetProduct!.name}` })
    .click();

  const modal = page.getByTestId(`product-detail-modal-${targetProduct!.id}`);
  const modalOpened = await modal
    .waitFor({ state: "visible", timeout: 1000 })
    .then(() => true)
    .catch(() => false);
  if (modalOpened) {
    // Sản phẩm có modifier: nút + mở modal chi tiết thay vì thêm ngay —
    // hoàn tất luồng thêm qua modal, giữ số lượng mặc định là 1.
    await modal.getByRole("button", { name: /^Thêm 1 vào giỏ$/ }).click();
    await expect(modal).toBeHidden();
  }

  const cartButton = page.getByRole("button", { name: "Xem giỏ hàng" });
  await expect(cartButton).toBeEnabled();
  await expect(cartButton.locator("span").last()).toHaveText("1");

  await cartButton.click();
  await expect(page).toHaveURL(new RegExp(`/menu/${tableToken}/cart$`));
  await expect(
    page.getByRole("button", { name: "Giảm số lượng" }),
  ).toHaveCount(1);

  expect(failures.consoleErrors).toEqual([]);
  expect(failures.failedResponses).toEqual([]);
});
