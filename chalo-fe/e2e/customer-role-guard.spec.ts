import { expect, test } from "@playwright/test";

// Bug thực tế: khách hàng đăng nhập Google (role CUSTOMER) từng bị middleware
// đá vào /staff/orders giống nhân viên, và không hề bị chặn khỏi khu vực
// /staff. Middleware phải coi CUSTOMER là khách, không phải nhân viên.

// Middleware chạy trên request đầu tiên, trước khi bất kỳ script nào của
// trang kịp thực thi — nên cookie phải nằm sẵn trong cookie jar (context.addCookies)
// chứ không thể set bằng document.cookie qua addInitScript (chạy sau khi
// response/redirect từ middleware đã quyết định xong).
test.describe("middleware chặn CUSTOMER khỏi khu vực nhân viên", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await context.addCookies([
      {
        name: "ACCESS_TOKEN",
        value: "customer-access-token",
        url: baseURL,
      },
      { name: "USER_ROLE", value: "CUSTOMER", url: baseURL },
    ]);
  });

  test("CUSTOMER mở /staff/orders bị đá về /account, không phải ở lại /staff", async ({
    page,
  }) => {
    await page.goto("/staff/orders", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/account$/);
  });

  test("CUSTOMER đăng nhập xong ở trang login được đưa thẳng về /account", async ({
    page,
  }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/account$/);
  });
});
