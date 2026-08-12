import { expect, test } from "@playwright/test";

const loginResponse = {
  code: 200,
  message: "success",
  data: {
    accessToken: "google-access-token",
    refreshToken: "google-refresh-token",
    user: {
      id: 42,
      username: "google_customer",
      fullName: "Khách Google",
      avatar: null,
      role: "CUSTOMER",
      permission: [],
    },
  },
};

test("Google callback exchanges a one-time code and removes it from browser history", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const unexpectedFailures: string[] = [];
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.text().includes("Failed to load resource")
    ) {
      consoleErrors.push(message.text());
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      unexpectedFailures.push(`${response.status()} ${response.url()}`);
    }
  });
  await page.route("**/account*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><html><body><main><h1>Tài khoản</h1></main></body></html>",
    });
  });
  const exchangedBodies: unknown[] = [];
  await page.route("**/api/auth/google/exchange", async (route) => {
    exchangedBodies.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(loginResponse) });
  });

  await page.goto("/oauth/google/callback?code=one-time-code-with-at-least-forty-characters-123&returnTo=%2Faccount");

  await expect(page).toHaveURL(/\/account$/);
  expect(exchangedBodies).toEqual([
    { code: "one-time-code-with-at-least-forty-characters-123" },
  ]);
  expect(page.url()).not.toContain("code=");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const stored = localStorage.getItem("chalo-auth");
        return stored ? JSON.parse(stored).state.accessToken : null;
      }),
    )
    .toBe("google-access-token");
  expect(consoleErrors).toEqual([]);
  expect(unexpectedFailures).toEqual([]);
});

test("missing callback code shows a recovery action without making an exchange request", async ({
  page,
}) => {
  let exchangeRequests = 0;
  await page.route("**/api/auth/google/exchange", async (route) => {
    exchangeRequests += 1;
    await route.abort();
  });

  await page.goto("/oauth/google/callback");

  await expect(page.getByRole("heading", { name: "Không thể đăng nhập" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Quay lại đăng nhập" })).toHaveAttribute("href", "/login");
  expect(exchangeRequests).toBe(0);
});

test("login page offers Google sign-in and keeps the layout usable on mobile", async ({
  page,
}, testInfo) => {
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");

  await expect(page.getByRole("button", { name: "Tiếp tục với Google" })).toBeVisible();
  await expect(page.locator("body").evaluate((body) => body.scrollWidth <= body.clientWidth)).resolves.toBe(true);
  await page.screenshot({ path: testInfo.outputPath("google-login-mobile.png"), fullPage: true });
  expect(consoleErrors).toEqual([]);
  expect(failedResponses).toEqual([]);
});
