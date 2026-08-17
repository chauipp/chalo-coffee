import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import type { OrderDto } from "../src/services/order/order.types";

const ok = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ code: 200, message: "success", data }),
});

const tableToken = "sepay-table";
const payCode = "CK7F3K2M";
const sessionId = "session-sepay-1";

const order: OrderDto = {
  id: "order-sepay-1",
  tableId: "table-sepay-1",
  tableName: "Bàn SePay",
  tableToken,
  orderSource: "QR",
  items: [
    {
      id: "item-sepay-1",
      productId: "product-sepay-1",
      productName: "Cà phê sữa đá",
      productImageUrl: null,
      price: 35_000,
      quantity: 1,
      preparedQuantity: 0,
      subtotal: 35_000,
      note: null,
    },
  ],
  status: "COMPLETED",
  paidStatus: false,
  totalAmount: 35_000,
  estimateWaitMinutes: null,
  note: null,
  createdAt: "2026-08-17T01:00:00.000Z",
  updatedAt: "2026-08-17T01:00:00.000Z",
};

const staff = {
  id: "staff-sepay-1",
  username: "staff",
  fullName: "Nhân viên quầy",
  avatar: null,
  role: "MODERATOR",
  permission: [],
};

async function installSseFixture(page: Page) {
  await page.addInitScript(() => {
    type Listener = (event: MessageEvent) => void;
    class FixtureEventSource {
      static instances: FixtureEventSource[] = [];
      private openListener: (() => void) | null = null;
      onerror: (() => void) | null = null;
      private listeners = new Map<string, Listener[]>();

      constructor() {
        FixtureEventSource.instances.push(this);
      }

      set onopen(listener: (() => void) | null) {
        this.openListener = listener;
        // useSSE gán onopen sau constructor; chỉ phát khi listener đã sẵn sàng
        window.setTimeout(() => this.openListener?.(), 0);
      }

      get onopen() {
        return this.openListener;
      }

      addEventListener(type: string, listener: Listener) {
        this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
      }

      close() {}

      emit(type: string, data: unknown) {
        for (const listener of this.listeners.get(type) ?? []) {
          listener({ data: JSON.stringify(data) } as MessageEvent);
        }
      }
    }

    window.EventSource = FixtureEventSource as unknown as typeof EventSource;
    (window as unknown as { __emitFixtureSse: (type: string, data: unknown) => void })
      .__emitFixtureSse = (type, data) => {
      for (const source of FixtureEventSource.instances) source.emit(type, data);
    };
    (window as unknown as { __printCount: number }).__printCount = 0;
    window.print = () => {
      (window as unknown as { __printCount: number }).__printCount += 1;
    };
  });
}

async function emitSse(page: Page, type: string, data: unknown) {
  await page.evaluate(
    ({ type: eventType, data: eventData }) =>
      (
        window as unknown as {
          __emitFixtureSse: (type: string, data: unknown) => void;
        }
      ).__emitFixtureSse(eventType, eventData),
    { type, data },
  );
}

function collectBrowserFailures(page: Page) {
  const consoleErrors: string[] = [];
  const badResponses: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
  });
  return { consoleErrors, badResponses };
}

async function restoreStaffSession(context: BrowserContext, baseURL: string) {
  await context.addCookies([
    {
      name: "chalo_access",
      value: "staff-session",
      url: baseURL,
      httpOnly: true,
      sameSite: "Strict",
      expires: Math.floor(Date.now() / 1_000) + 15 * 60,
    },
    {
      name: "chalo_role",
      value: "MODERATOR",
      url: baseURL,
      sameSite: "Strict",
      expires: Math.floor(Date.now() / 1_000) + 7 * 24 * 60 * 60,
    },
  ]);
  // Cookie xác thực là nguồn quyền truy cập; localStorage chỉ giữ hồ sơ hiển thị
  // để Zustand khôi phục UI sau khi PWA bị đóng rồi mở lại.
  await context.addInitScript((authenticatedUser) => {
    localStorage.setItem(
      "chalo-auth",
      JSON.stringify({ state: { user: authenticatedUser }, version: 0 }),
    );
  }, staff);
}

test("khách chờ SePay xác nhận thay vì tự khai đã thanh toán", async ({ page }) => {
  const failures = collectBrowserFailures(page);
  await page.setViewportSize({ width: 375, height: 667 });
  await installSseFixture(page);
  await page.route("**/api/order/checkout/preview", (route) =>
    route.fulfill(
      ok({
        tableId: order.tableId,
        tableName: order.tableName,
        tableToken,
        orderIds: [order.id],
        totalAmount: order.totalAmount,
        orders: [order],
      }),
    ),
  );
  await page.route("**/api/order/checkout/start", (route) =>
    route.fulfill(
      ok({
        sessionId,
        clientSecret: "secret",
        payCode,
        tableId: order.tableId,
        tableToken,
        orderIds: [order.id],
        totalAmount: order.totalAmount,
        expiresAt: "2099-08-17T01:30:00.000Z",
        orders: [order],
      }),
    ),
  );
  await page.route("**/api/settings", (route) =>
    route.fulfill(
      ok({
        bankBin: "970422",
        bankAccountNo: "0123456789",
        bankAccountName: "CHALO COFFEE",
      }),
    ),
  );

  await page.goto(`/menu/${tableToken}/checkout`);
  await page.getByRole("button", { name: /Thanh toán 35\.000đ/ }).click();

  await expect(page.getByTestId("vietqr-code")).toBeVisible();
  await expect(page.getByText(payCode, { exact: true })).toBeVisible();
  await expect(page.getByTestId("awaiting-bank")).toBeVisible();
  await expect(page.getByRole("button", { name: /Tôi đã thanh toán/ })).toHaveCount(0);

  await emitSse(page, "payment_completed", {
    sessionId,
    tableId: order.tableId,
    tableToken,
    orderIds: [order.id],
    totalAmount: order.totalAmount,
    source: "sepay",
  });
  await expect(page.getByText("Đã thanh toán tất cả đơn của bàn")).toBeVisible();
  await expect(
    page.locator("body").evaluate((body) => body.scrollWidth <= body.clientWidth),
  ).resolves.toBe(true);
  expect(failures.consoleErrors).toEqual([]);
  expect(failures.badResponses).toEqual([]);
});

test("thanh toán một đơn cũng tạo phiên SePay, không gọi endpoint tự khai", async ({ page }) => {
  const failures = collectBrowserFailures(page);
  await page.setViewportSize({ width: 375, height: 667 });
  await installSseFixture(page);
  let startCalls = 0;
  await page.route(`**/api/order/by-token/${tableToken}`, (route) =>
    route.fulfill(ok([order])),
  );
  await page.route("**/api/order/checkout/start", (route) => {
    startCalls += 1;
    return route.fulfill(
      ok({
        sessionId,
        clientSecret: "secret",
        payCode,
        tableId: order.tableId,
        tableToken,
        orderIds: [order.id],
        totalAmount: order.totalAmount,
        expiresAt: "2099-08-17T01:30:00.000Z",
        orders: [order],
      }),
    );
  });
  await page.route("**/api/settings", (route) =>
    route.fulfill(
      ok({
        bankBin: "970422",
        bankAccountNo: "0123456789",
        bankAccountName: "CHALO COFFEE",
      }),
    ),
  );
  await page.route("**/api/order/pay", (route) => route.abort());

  await page.goto(`/menu/${tableToken}/orders/${order.id}`);
  await page.getByRole("button", { name: /Thanh toán.*35\.000đ/ }).click();

  await expect(page.getByRole("dialog", { name: "Thanh toán chuyển khoản" })).toBeVisible();
  await expect(page.getByText(payCode, { exact: true })).toBeVisible();
  await expect(page.getByTestId("awaiting-bank")).toBeVisible();
  expect(startCalls).toBe(1);
  expect(failures.consoleErrors).toEqual([]);
  expect(failures.badResponses).toEqual([]);
});

test("trạm in nhận payment_completed, in một lần và cho phép in lại", async ({
  context,
  page,
  baseURL,
}) => {
  const failures = collectBrowserFailures(page);
  await installSseFixture(page);
  await restoreStaffSession(context, baseURL!);
  await page.route("**/api/auth/me", (route) => route.fulfill(ok(staff)));
  // Staff layout luôn mount khu pha chế, nên các request nền này cũng phải có
  // fixture; nếu không chúng che lỗi UI bằng 401/400 từ backend local.
  await page.route("**/api/order/active", (route) => route.fulfill(ok([])));
  await page.route("**/api/pager/list**", (route) => route.fulfill(ok([])));
  await page.route("**/api/order/page**", (route) =>
    route.fulfill(ok({ list: [], total: 0, pageNo: 1, pageSize: 100 })),
  );
  await page.route("**/api/order/detail**", (route) => route.fulfill(ok(order)));

  await page.goto("/staff/print-station");
  await expect(page.getByText("Trạm in hoá đơn")).toBeVisible();
  await expect(page.getByText("Đang nghe thanh toán")).toBeVisible();

  await emitSse(page, "payment_completed", {
    sessionId,
    tableId: order.tableId,
    tableToken,
    orderIds: [order.id],
    totalAmount: order.totalAmount,
    source: "sepay",
  });
  await expect(page.getByTestId("payment-receipt-root")).toContainText(order.items[0].productName);
  await expect(page.getByText(/CK tự động/)).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __printCount: number }).__printCount))
    .toBe(1);

  await page.getByRole("button", { name: "In lại" }).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __printCount: number }).__printCount))
    .toBe(2);
  expect(failures.consoleErrors).toEqual([]);
  expect(failures.badResponses).toEqual([]);
});
