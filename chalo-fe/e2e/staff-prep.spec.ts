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
  // 3 cột trái
  await expect(page.getByText("Chờ xác nhận")).toBeVisible();
  await expect(page.getByText("Đã xác nhận")).toBeVisible();

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
