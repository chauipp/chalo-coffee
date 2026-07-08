import { expect, test } from "@playwright/test";

const BE = "http://localhost:8080/api";

test("customer product card opens image detail modal with description and quantity add", async ({
  page,
  request,
}) => {
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
  const tableToken =
    tables.find((table) => table.status !== "OCCUPIED")?.qrToken ??
    tables[0]?.qrToken;

  const productsRes = await request.get(`${BE}/menu/product/list`, {
    headers: auth,
  });
  const products = (await productsRes.json()).data as Array<{
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    status: string;
    isActive: boolean;
  }>;
  const product = products.find(
    (item) =>
      item.isActive &&
      item.status === "AVAILABLE" &&
      item.description,
  );

  if (!tableToken || !product) {
    test.skip(true, "Need an available product with description");
    return;
  }
  const targetProduct = product;

  await page.goto(`/menu/${tableToken}`);
  const occupiedContinue = page.locator("div.fixed.inset-0.z-50 button").first();
  const occupiedVisible = await occupiedContinue
    .waitFor({ state: "visible", timeout: 1000 })
    .then(() => true)
    .catch(() => false);
  if (occupiedVisible) {
    await occupiedContinue.click();
  }

  await page.getByPlaceholder(/món/i).fill(targetProduct.name);

  const card = page.getByTestId(`product-card-${targetProduct.id}`);
  await expect(card).toBeVisible({ timeout: 15_000 });
  await expect(card.getByText(targetProduct.description!)).toHaveCount(0);

  await card
    .getByRole("button", { name: `Xem chi tiết ${targetProduct.name}` })
    .click();

  const modal = page.getByTestId(`product-detail-modal-${targetProduct.id}`);
  await expect(modal).toBeVisible();
  await expect(
    modal.getByRole("heading", { name: targetProduct.name }),
  ).toBeVisible();
  await expect(modal.getByTestId("product-detail-media")).toBeVisible();
  if (targetProduct.imageUrl) {
    await expect(
      modal.getByRole("img", { name: targetProduct.name }),
    ).toBeVisible();
  }
  await expect(modal.getByText(targetProduct.description!)).toBeVisible();

  await modal.getByRole("button", { name: "Tăng số lượng" }).click();
  await modal.getByRole("button", { name: "Thêm 2 vào giỏ" }).click();

  await expect(modal).toBeHidden();
  await expect(page.getByText("2").last()).toBeVisible();
});
