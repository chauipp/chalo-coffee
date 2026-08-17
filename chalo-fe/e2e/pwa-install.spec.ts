import { expect, test, type Page } from "@playwright/test";

const customer = {
  id: "pwa-customer",
  username: "pwa_customer",
  fullName: "PWA Customer",
  avatar: null,
  role: "CUSTOMER",
  permission: [],
};

const staff = {
  id: "pwa-staff",
  username: "pwa_staff",
  fullName: "PWA Staff",
  avatar: null,
  role: "MODERATOR",
  permissions: ["order:read"],
};

function response(data: unknown) {
  return {
    code: 200,
    message: "pwa-network-fixture",
    data,
  };
}

function apiResponse(data: unknown) {
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(response(data)),
  };
}

async function emulateMobileChromium(page: Page, standalone = false) {
  await page.addInitScript(({ installed }) => {
    const nativeMatchMedia = window.matchMedia.bind(window);

    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      get: () =>
        "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
    });

    window.matchMedia = ((query: string) => {
      if (query.includes("display-mode: standalone") || query.includes("display-mode: fullscreen")) {
        return {
          matches: installed,
          media: query,
          onchange: null,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          addListener: () => undefined,
          removeListener: () => undefined,
          dispatchEvent: () => false,
        } as MediaQueryList;
      }

      return nativeMatchMedia(query);
    }) as typeof window.matchMedia;
  }, { installed: standalone });
}

async function emulateIpadOsDesktop(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      get: () =>
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 " +
        "Version/13.1 Mobile/15E148 Safari/604.1",
    });
    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      get: () => 5,
    });
  });
}

async function activateWorkerAndReload(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        return registration?.active?.state ?? "missing";
      }),
    )
    .toBe("activated");

  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
}

async function waitForPwaClient(page: Page) {
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.getRegistration().then(Boolean))).toBe(true);
}

async function dispatchDeferredInstallEvent(page: Page) {
  return page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    let resolveChoice: ((choice: { outcome: "accepted" | "dismissed"; platform: string }) => void) | undefined;
    const testWindow = window as typeof window & {
      __pwaInstallTest?: {
        promptCalls: number;
        resolveChoice: (choice: { outcome: "accepted" | "dismissed"; platform: string }) => void;
      };
    };
    const userChoice = new Promise<{ outcome: "accepted" | "dismissed"; platform: string }>((resolve) => {
      resolveChoice = resolve;
    });
    const installTest = {
      promptCalls: 0,
      resolveChoice: (choice: { outcome: "accepted" | "dismissed"; platform: string }) => resolveChoice?.(choice),
    };
    testWindow.__pwaInstallTest = installTest;

    Object.defineProperties(event, {
      prompt: {
        value: async () => {
          installTest.promptCalls += 1;
        },
      },
      userChoice: {
        value: userChoice,
      },
    });

    window.dispatchEvent(event);
    return { defaultPrevented: event.defaultPrevented, prompted: installTest.promptCalls > 0 };
  });
}

async function resolveDeferredInstallChoice(page: Page, outcome: "accepted" | "dismissed") {
  await page.evaluate((choice) => {
    const testWindow = window as typeof window & {
      __pwaInstallTest?: {
        resolveChoice: (value: { outcome: "accepted" | "dismissed"; platform: string }) => void;
      };
    };
    testWindow.__pwaInstallTest?.resolveChoice({ outcome: choice, platform: "web" });
  }, outcome);
}

async function seedCustomer(page: Page) {
  await page.evaluate((authenticatedCustomer) => {
    localStorage.setItem(
      "chalo-auth",
      JSON.stringify({
        state: {
          accessToken: "pwa-access-token",
          refreshToken: "pwa-refresh-token",
          user: authenticatedCustomer,
        },
        version: 0,
      }),
    );
  }, customer);
}

async function installStaffPosFixture(page: Page) {
  await page.route("**/api/auth/login", (route) => route.fulfill(apiResponse({ accessToken: "pwa-staff-token", refreshToken: "pwa-staff-refresh", user: staff })));
  await page.route("**/api/auth/me", (route) => route.fulfill(apiResponse(staff)));
  await page.route("**/api/menu/category/simple-list", (route) => route.fulfill(apiResponse([])));
  await page.route("**/api/menu/product/page**", (route) => route.fulfill(apiResponse({ list: [], total: 0 })));
  await page.route("**/api/table/list", (route) => route.fulfill(apiResponse([])));
  await page.route("**/api/order/active", (route) => route.fulfill(apiResponse([])));
  await page.route("**/api/order/events**", (route) => route.fulfill({ status: 200, contentType: "text/event-stream", body: ": fixture connected\n\n" }));
}

async function loginStaff(page: Page) {
  await page.goto("/login");
  await page.locator("#username").fill("pwa_staff");
  await page.locator("#password").fill("password");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/staff/**");
}

function collectBrowserFailures(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedResponses: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  return { consoleErrors, pageErrors, failedResponses };
}

test("PWA production manifest, worker, prompt, and API network boundary", async ({ page }) => {
  const failures = collectBrowserFailures(page);
  let apiRouteCalls = 0;

  await page.route("**/api/customer/table-session", async (route) => {
    apiRouteCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response(null)),
    });
  });
  await emulateMobileChromium(page);
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute("href", "/brand/chalo-pwa-192.png");
  const manifest = await page.evaluate(async () => {
    const response = await fetch("/manifest.webmanifest");
    return response.json();
  });
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ src: "/brand/chalo-pwa-192.png", sizes: "192x192" }),
      expect.objectContaining({ src: "/brand/chalo-pwa-512.png", sizes: "512x512" }),
    ]),
  );

  await activateWorkerAndReload(page);
  const cacheKeys = await page.evaluate(async () => caches.keys());
  expect(cacheKeys.some((cacheKey) => cacheKey.startsWith("chalo-static-"))).toBe(true);
  const pwaIconIsCached = await page.evaluate(async () => {
    const cacheName = (await caches.keys()).find((name) => name.startsWith("chalo-static-"));
    const response = cacheName ? await (await caches.open(cacheName)).match("/brand/chalo-pwa-192.png") : undefined;
    return response?.headers.get("content-type")?.startsWith("image/") ?? false;
  });
  expect(pwaIconIsCached).toBe(true);
  let blockedStaticAssetRequests = 0;
  await page.route("**/brand/chalo-pwa-192.png", (route) => {
    blockedStaticAssetRequests += 1;
    return route.abort();
  });
  const cachedStaticAsset = await page.evaluate(async () => {
    const response = await fetch("/brand/chalo-pwa-192.png");
    return {
      ok: response.ok,
      contentType: response.headers.get("content-type"),
    };
  });
  expect(cachedStaticAsset).toEqual({ ok: true, contentType: expect.stringMatching(/^image\//) });
  expect(blockedStaticAssetRequests).toBe(0);

  await seedCustomer(page);
  await page.reload();
  await expect.poll(() => apiRouteCalls).toBeGreaterThan(0);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(300);
  expect(apiRouteCalls).toBe(1);
  const cachedRequestPaths = await page.evaluate(async () => {
    const cacheNames = await caches.keys();
    const requests = await Promise.all(
      cacheNames.map(async (cacheName) => (await caches.open(cacheName)).keys()),
    );
    return requests.flat().map((request) => new URL(request.url).pathname);
  });
  expect(cachedRequestPaths.filter((path) => path.startsWith("/api/"))).toEqual([]);

  await expect(page.getByTestId("pwa-install-prompt")).toHaveCount(0);
  const installEvent = await dispatchDeferredInstallEvent(page);
  expect(installEvent).toEqual({ defaultPrevented: true, prompted: false });
  await expect(page.getByTestId("pwa-install-prompt")).toBeVisible();
  const promptBox = await page.getByTestId("pwa-install-prompt").boundingBox();
  expect(promptBox).not.toBeNull();
  // Staff/admin mobile navs are about 68px tall; the prompt reserves 80px plus safe area.
  expect((promptBox?.y ?? 0) + (promptBox?.height ?? 0)).toBeLessThanOrEqual(667 - 80);
  await expect(page.locator("body").evaluate((body) => body.scrollWidth <= body.clientWidth)).resolves.toBe(true);
  await page.getByRole("button", { name: "Cài ứng dụng" }).click();
  await expect(page.getByRole("button", { name: "Đang mở…" })).toBeDisabled();
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __pwaInstallTest?: { promptCalls: number } }).__pwaInstallTest?.promptCalls ?? 0)).toBe(1);
  await resolveDeferredInstallChoice(page, "dismissed");
  await expect(page.getByTestId("pwa-install-prompt")).toBeHidden();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("chalo-pwa-install-dismissed"))).toBe("true");

  expect(failures.consoleErrors).toEqual([]);
  expect(failures.pageErrors).toEqual([]);
  expect(failures.failedResponses).toEqual([]);
});

test("PWA notice is absent on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await waitForPwaClient(page);

  const installEvent = await dispatchDeferredInstallEvent(page);
  expect(installEvent.defaultPrevented).toBe(true);
  await expect(page.getByTestId("pwa-install-prompt")).toHaveCount(0);
});

test("PWA notice is suppressed in installed display mode", async ({ page }) => {
  await emulateMobileChromium(page, true);
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await waitForPwaClient(page);

  const installEvent = await dispatchDeferredInstallEvent(page);
  expect(installEvent.defaultPrevented).toBe(true);
  await expect(page.getByTestId("pwa-install-prompt")).toHaveCount(0);
});

test("iPadOS desktop user agent receives the iOS install guide", async ({ page }) => {
  await emulateIpadOsDesktop(page);
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await waitForPwaClient(page);

  await expect(page.getByTestId("pwa-install-prompt")).toBeVisible();
  await expect(page.getByText("Thêm vào Màn hình chính")).toBeVisible();
  await expect(page.getByRole("button", { name: "Cài ứng dụng" })).toHaveCount(0);
});

test("PWA notice stays above staff POS bottom controls on mobile", async ({ page }) => {
  await emulateMobileChromium(page);
  await page.setViewportSize({ width: 375, height: 667 });
  await installStaffPosFixture(page);
  await loginStaff(page);
  await page.goto("/staff/pos");
  await expect(page.getByRole("button", { name: /Giỏ hàng/ })).toBeVisible();

  const installEvent = await dispatchDeferredInstallEvent(page);
  expect(installEvent.defaultPrevented).toBe(true);
  await expect(page.getByTestId("pwa-install-prompt")).toBeVisible();

  const [promptBox, headerBox, cartButtonBox, mobileNavBox] = await Promise.all([
    page.getByTestId("pwa-install-prompt").boundingBox(),
    page.getByRole("banner").boundingBox(),
    page.getByRole("button", { name: /Giỏ hàng/ }).boundingBox(),
    page.getByTestId("staff-mobile-nav").boundingBox(),
  ]);
  expect(promptBox).not.toBeNull();
  expect(headerBox).not.toBeNull();
  expect(cartButtonBox).not.toBeNull();
  expect(mobileNavBox).not.toBeNull();
  expect(promptBox?.y ?? 0).toBeGreaterThanOrEqual((headerBox?.y ?? 0) + (headerBox?.height ?? 0));
  expect((promptBox?.y ?? 0) + (promptBox?.height ?? 0)).toBeLessThan(cartButtonBox?.y ?? 0);
  expect((promptBox?.y ?? 0) + (promptBox?.height ?? 0)).toBeLessThan(mobileNavBox?.y ?? 0);
});
