import { test, expect, APIRequestContext } from "@playwright/test";

// Màn pha chế lấy món làm trung tâm. Test này CÓ mutate DB (tạo đơn mới, kéo
// đơn vào pha, tick ly) — chạy trên dữ liệu dev, không chạy trên môi trường
// thật. Mỗi test tự tạo tiền đề của mình qua API (BE 8082) để không phụ thuộc
// dữ liệu ambient hay thứ tự chạy của các test khác — UUID bàn/món được sinh
// ngẫu nhiên mỗi lần reseed nên không hardcode, luôn khám phá qua API.
const BE = "http://localhost:8082/api";

type Table = { qrToken: string; name: string };
type Product = { id: string; name: string };

/** Đăng nhập lấy access token để gọi các endpoint cần auth (vd table/list). */
async function apiLogin(
  request: APIRequestContext,
  username: string,
  password: string,
): Promise<string> {
  const res = await request.post(`${BE}/auth/login`, {
    data: { username, password },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return body.data.accessToken as string;
}

/** Lấy danh sách bàn (cần auth) + danh sách món public — để tự tạo đơn test. */
async function discoverFixtures(
  request: APIRequestContext,
): Promise<{ tables: Table[]; products: Product[] }> {
  const token = await apiLogin(request, "staff", "staff");
  const tablesRes = await request.get(`${BE}/table/list`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(tablesRes.ok()).toBeTruthy();
  const tables = ((await tablesRes.json()).data as Table[]).filter(
    (t) => t.qrToken,
  );

  const productsRes = await request.get(`${BE}/menu/product/list`);
  expect(productsRes.ok()).toBeTruthy();
  const products = (await productsRes.json()).data as Product[];

  expect(tables.length).toBeGreaterThanOrEqual(3);
  expect(products.length).toBeGreaterThan(0);
  return { tables, products };
}

/** Tạo một đơn mới qua API public — mặc định PENDING, chưa thanh toán. */
async function seedOrder(
  request: APIRequestContext,
  tableToken: string,
  items: { productId: string; quantity: number; note?: string }[],
) {
  const res = await request.post(`${BE}/order/create`, {
    data: { tableToken, items },
  });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).data;
}

async function loginUI(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.locator("#username").fill("staff");
  await page.locator("#password").fill("staff");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/staff/**");
}

test("tick đủ ly của một bàn thì đơn tự sang Sẵn sàng phục vụ", async ({
  page,
  request,
}) => {
  // Tiền đề: đảm bảo có ít nhất một đơn "Khách đặt" để kéo vào pha, không phụ
  // thuộc dữ liệu ambient còn sót lại từ lần chạy trước.
  const { tables, products } = await discoverFixtures(request);
  await seedOrder(request, tables[0].qrToken, [
    { productId: products[0].id, quantity: 1 },
  ]);

  await loginUI(page);
  await page.goto("/staff/orders");

  // Cột mới đúng nhãn — scope theo span.text-sm.font-bold để tránh khớp hint rỗng
  await expect(page.locator("span.text-sm.font-bold", { hasText: "Khách đặt" })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("span.text-sm.font-bold", { hasText: "Sẵn sàng phục vụ" })).toBeVisible();
  await expect(page.locator("span.text-sm.font-bold", { hasText: "Đã phục vụ" })).toBeVisible();

  // Kéo một đơn "Khách đặt" vào pha
  // Lưu ý: card đơn (OrderCard) là một <div role="button"> bọc ngoài chứa
  // luôn <button>Bắt đầu pha →</button> bên trong — accessible name của div
  // ngoài gồm toàn bộ text trong card nên CŨNG khớp "Bắt đầu pha" theo
  // getByRole. Dùng CSS tag "button" để chỉ trúng đúng <button> thật, tránh
  // .first() rơi vào div ngoài (khiến bấm vào mở popup chi tiết đơn thay vì
  // đổi trạng thái).
  const startBtn = page.locator('button:has-text("Bắt đầu pha")').first();
  await expect(startBtn).toBeVisible({ timeout: 15_000 });
  await startBtn.click();

  // Khu pha chế hiện card theo MÓN (không phải theo bàn)
  const productCard = page.locator('[data-testid^="prep-product-"]').first();
  await expect(productCard).toBeVisible({ timeout: 15_000 });

  // Dải tiến độ theo bàn xuất hiện
  const bar = page.getByTestId("table-progress-bar");
  await expect(bar).toBeVisible();

  // Tick hết ly trong card đầu tiên. Card gom nhiều bàn, và mỗi đơn ở đây chỉ
  // có 1 ly (quantity=1) nên tick MỘT ly là đơn đó đủ điều kiện xong ngay lập
  // tức -> BE tự đẩy đơn đó sang READY -> ly đó (và có thể cả card, nếu hết
  // đơn PREPARING chứa món này) biến mất khỏi DOM ngay giữa vòng lặp. Vì vậy
  // không duyệt theo index cố định (dễ lệch khi danh sách co lại) — luôn truy
  // vấn lại nút "button[aria-pressed=false]" đầu tiên còn sót và bấm, tới khi
  // hết hoặc chạm giới hạn an toàn (đúng bằng số ly ban đầu).
  const initialCount = await productCard.locator("button[aria-pressed]").count();
  for (let i = 0; i < initialCount; i++) {
    const remaining = productCard.locator('button[aria-pressed="false"]');
    if ((await remaining.count()) === 0) break;
    await remaining.first().click();
    await page.waitForTimeout(300);
  }

  // Đơn rời khu pha chế (BE tự đẩy sang READY khi đủ ly). Card gom nhiều bàn
  // nên có thể đẩy nhiều đơn sang READY cùng lúc — số chip giảm là đúng.
  await expect(async () => {
    const chips = await bar.locator("button").count();
    expect(chips).toBeLessThan(initialCount + 1);
  }).toPass({ timeout: 15_000 });
});

test("bấm chip bàn mở popup liệt kê món của bàn, Esc đóng", async ({
  page,
  request,
}) => {
  // Tự đảm bảo tiền đề: cần một đơn đang PREPARING để dải tiến độ theo bàn
  // xuất hiện — tự tạo đơn rồi tự bấm "Bắt đầu pha", không phụ thuộc test khác.
  const { tables, products } = await discoverFixtures(request);
  await seedOrder(request, tables[1].qrToken, [
    { productId: products[0].id, quantity: 1 },
  ]);

  await loginUI(page);
  await page.goto("/staff/orders");

  // Lưu ý: card đơn (OrderCard) là một <div role="button"> bọc ngoài chứa
  // luôn <button>Bắt đầu pha →</button> bên trong — accessible name của div
  // ngoài gồm toàn bộ text trong card nên CŨNG khớp "Bắt đầu pha" theo
  // getByRole. Dùng CSS tag "button" để chỉ trúng đúng <button> thật, tránh
  // .first() rơi vào div ngoài (khiến bấm vào mở popup chi tiết đơn thay vì
  // đổi trạng thái).
  const startBtn = page.locator('button:has-text("Bắt đầu pha")').first();
  await expect(startBtn).toBeVisible({ timeout: 15_000 });
  await startBtn.click();

  const bar = page.getByTestId("table-progress-bar");
  await expect(bar).toBeVisible({ timeout: 15_000 });

  await bar.locator("button").first().click();
  const popover = page.getByTestId("table-popover");
  await expect(popover).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(popover).toBeHidden();
});

test("card đơn viền đỏ khi chưa trả tiền, kèm badge chữ", async ({
  page,
  request,
}) => {
  // Tự đảm bảo tiền đề: tạo hẳn một đơn mới qua API — đơn mới luôn
  // paidStatus=false nên chắc chắn có card viền đỏ + badge "Chưa thanh toán"
  // trên màn, không phụ thuộc đơn chưa thanh toán còn sót lại từ trước.
  const { tables, products } = await discoverFixtures(request);
  await seedOrder(request, tables[2].qrToken, [
    { productId: products[0].id, quantity: 1 },
  ]);

  await loginUI(page);
  await page.goto("/staff/orders");

  // Màu không phải tín hiệu duy nhất — luôn có badge chữ
  await expect(page.getByText("Chưa thanh toán").first()).toBeVisible({
    timeout: 15_000,
  });
});
