import { test, expect } from "@playwright/test";

// Smoke màn split-screen pha chế của staff — chỉ đọc UI, KHÔNG mutate DB.
// Chạy: PLAYWRIGHT_BASE_URL=http://localhost:3020 pnpm exec playwright test e2e/staff-prep.spec.ts
test("staff orders page shows split layout with draggable/keyboard resizer", async ({
  page,
}) => {
  await page.goto("/login");
  await page.locator("#username").fill("staff");
  await page.locator("#password").fill("staff");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/staff/**");
  await page.goto("/staff/orders");

  // Hai vùng + thanh chia hiển thị
  const resizer = page.getByTestId("split-resizer");
  await expect(resizer).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByRole("heading", { name: "Đang pha chế" }),
  ).toBeVisible();
  // 3 cột trái — nhãn đổi theo luồng đơn hàng mới (Task 10)
  // Scope theo span.text-sm.font-bold để tránh khớp hint rỗng
  await expect(
    page.locator("span.text-sm.font-bold", { hasText: "Khách đặt" }).last(),
  ).toBeVisible();
  await expect(page.locator("span.text-sm.font-bold", { hasText: "Sẵn sàng phục vụ" })).toBeVisible();
  await expect(page.locator("span.text-sm.font-bold", { hasText: "Đã phục vụ" })).toBeVisible();

  // Resize bằng bàn phím: ← 2 lần → thanh chia dịch sang trái
  const before = await resizer.boundingBox();
  await resizer.focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  const after = await resizer.boundingBox();
  expect(after!.x).toBeLessThan(before!.x);

  // Reload giữ tỷ lệ (persist localStorage)
  await page.reload();
  await expect(page.getByTestId("split-resizer")).toBeVisible({
    timeout: 15_000,
  });
  const reloaded = await page.getByTestId("split-resizer").boundingBox();
  expect(Math.abs(reloaded!.x - after!.x)).toBeLessThan(8);
});

test("khu pha chế hiển thị ở mọi màn staff", async ({
  page,
}) => {
  await page.goto("/login");
  await page.locator("#username").fill("staff");
  await page.locator("#password").fill("staff");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/staff/**");

  const prep = page.getByRole("heading", { name: "Đang pha chế" });
  const resizer = page.getByTestId("split-resizer");

  // Khu pha chế nằm ở layout → có mặt trên cả POS và Bàn, không chỉ Đơn hàng
  for (const path of ["/staff/orders", "/staff/pos", "/staff/tables"]) {
    await page.goto(path);
    await expect(prep).toBeVisible({ timeout: 15_000 });
    await expect(resizer).toBeVisible();
  }

  await expect(page.getByRole("link", { name: "POS" })).toBeVisible();
});
