import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const ok = (data: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ code: 200, message: "success", data }) });

async function restoreAdmin(context: BrowserContext, baseURL: string) {
  await context.addCookies([
    { name: "chalo_access", value: "admin-session", url: baseURL, httpOnly: true, sameSite: "Strict", expires: Math.floor(Date.now() / 1_000) + 900 },
    { name: "chalo_role", value: "ADMIN", url: baseURL, sameSite: "Strict", expires: Math.floor(Date.now() / 1_000) + 7 * 86400 },
  ]);
  await context.addInitScript(() => localStorage.setItem("chalo-auth", JSON.stringify({ state: { user: { id: "admin-audit", username: "admin", fullName: "Quản trị", avatar: null, role: "ADMIN", permission: [] } }, version: 0 })));
}

const entries = [
  { id: "audit-refund", actorUserId: 7, action: "REFUND_CREATED", entityType: "payment_transaction", entityId: "payment-abcdef", metadata: { amount: 35_000, method: "CASH" }, createdAt: "2026-08-17T02:00:00.000Z" },
  { id: "audit-stock", actorUserId: 7, action: "INVENTORY_RECEIVED", entityType: "ingredient", entityId: "coffee", metadata: { quantity: 500, reason: "Nhập sáng" }, createdAt: "2026-08-17T01:00:00.000Z" },
];

test("admin lọc được nhật ký hoạt động và trang không tràn ở mobile", async ({ page, context, baseURL }) => {
  const consoleErrors: string[] = [];
  const badResponses: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("response", (response) => { if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`); });
  await restoreAdmin(context, baseURL!);
  await page.route("**/api/audit-logs?*", (route) => route.fulfill(ok(entries)));
  await page.goto("/admin/audit");
  const logList = page.getByLabel("Danh sách nhật ký hoạt động");
  await expect(page.getByRole("heading", { name: "Nhật ký hoạt động" })).toBeVisible();
  await expect(logList.getByText("Ghi nhận hoàn tiền")).toBeVisible();
  await page.getByLabel("Lọc theo hoạt động").selectOption("INVENTORY_RECEIVED");
  await expect(logList.getByText("Nhập kho")).toBeVisible();
  await expect(logList.getByText("Ghi nhận hoàn tiền")).toHaveCount(0);
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page.locator("body").evaluate((body) => body.scrollWidth <= body.clientWidth)).resolves.toBe(true);
  expect(consoleErrors).toEqual([]);
  expect(badResponses).toEqual([]);
});
