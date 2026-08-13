import { test, expect } from "@playwright/test";

// Kiểm tab "Khách hàng" ở /admin/users (không lẫn với tab Nhân viên): tạo 1
// tài khoản khách hàng THẬT qua form đăng ký công khai (không mock), đăng
// nhập lại bằng admin, xác nhận khách xuất hiện trong danh sách, xem được chi
// tiết (điểm tích luỹ + lịch sử đơn), và khoá/mở khoá được tài khoản đó.
//
// NOTE: ghi 1 dòng user thật vào DB dùng chung, prefix "e2e_cust_" để dễ dọn.
test("admin xem và khoá/mở khoá tài khoản khách hàng ở tab Khách hàng", async ({
  page,
}) => {
  // 1. Tạo khách hàng thật qua form đăng ký công khai.
  const username = `e2e_cust_${Date.now()}`;
  await page.goto("/register");
  await page.locator("#fullName").fill("E2E Customer Bot");
  await page.locator("#username").fill(username);
  await page.locator("#password").fill("secret123");
  await page.locator("#confirmPassword").fill("secret123");
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await page.waitForURL("**/account");

  // 2. Đăng xuất khỏi phiên khách hàng (xoá token cục bộ), đăng nhập lại bằng
  //    admin/admin.
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.goto("/login");
  await page.locator("#username").fill("admin");
  await page.locator("#password").fill("admin");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin/dashboard");

  // 3. Mở /admin/users, chuyển sang tab Khách hàng.
  await page.getByRole("link", { name: "Người dùng" }).click();
  await page.waitForURL("**/admin/users");
  await page.getByRole("button", { name: "Khách hàng" }).click();

  // 4. Khách hàng vừa tạo xuất hiện trong danh sách (bảng desktop — dùng
  //    locator "tr" để không đụng hàng vào <article> mobileCard vốn luôn nằm
  //    trong DOM dù bị ẩn bằng CSS trên viewport desktop).
  const row = page.locator("tr", { hasText: `@${username}` });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(row.getByText("Hoạt động")).toBeVisible();

  // 5. Xem chi tiết: thấy điểm tích luỹ + thông báo chưa có đơn hàng.
  await row.getByRole("button", { name: "Xem" }).click();
  const dialog = page.getByRole("dialog", {
    name: "Khách hàng · E2E Customer Bot",
  });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/điểm/)).toBeVisible();
  await expect(dialog.getByText("Khách chưa có đơn hàng nào.")).toBeVisible();
  await dialog.getByLabel("Đóng").click();
  await expect(dialog).toBeHidden();

  // 6. Khoá tài khoản: toggle tắt, badge chuyển "Đã khoá".
  await row.getByTestId("customer-active-toggle").click();
  await expect(row.getByText("Đã khoá")).toBeVisible({ timeout: 15_000 });

  // 7. Mở khoá lại: toggle bật, badge quay về "Hoạt động".
  await row.getByTestId("customer-active-toggle").click();
  await expect(row.getByText("Hoạt động")).toBeVisible({ timeout: 15_000 });
});
