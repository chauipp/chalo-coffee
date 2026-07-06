// src/mocks/handlers/order.handlers.ts
import { http, HttpResponse, delay } from "msw";
import type { OrderDto, OrderStatus } from "@/services/order/order.types";

const generateId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).substring(2, 9)}`;

// Seed data — đầy đủ paidStatus
let orders: OrderDto[] = [
  {
    id: "ord_001",
    tableId: "tbl_01",
    tableName: "Bàn 01",
    tableToken: "qr-token-tbl_01",
    status: "PREPARING",
    paidStatus: false,
    items: [
      {
        id: "item_01",
        productId: "prod_01",
        productName: "Cà phê đen đá",
        productImageUrl: null,
        price: 25000,
        quantity: 2,
        subtotal: 50000,
        note: null,
      },
      {
        id: "item_02",
        productId: "prod_03",
        productName: "Bạc xỉu",
        productImageUrl: null,
        price: 35000,
        quantity: 1,
        subtotal: 35000,
        note: "Ít đá",
      },
    ],
    totalAmount: 85000,
    estimateWaitMinutes: 8,
    note: null,
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ord_002",
    tableId: "tbl_08",
    tableName: "Bàn 08",
    tableToken: "qr-token-tbl_08",
    status: "PENDING",
    paidStatus: false,
    items: [
      {
        id: "item_03",
        productId: "prod_08",
        productName: "Trà đào cam sả",
        productImageUrl: null,
        price: 45000,
        quantity: 2,
        subtotal: 90000,
        note: null,
      },
    ],
    totalAmount: 90000,
    estimateWaitMinutes: 5,
    note: "Đem ra cùng lúc",
    createdAt: new Date(Date.now() - 1 * 60_000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ord_003",
    tableId: "tbl_03",
    tableName: "Bàn 03",
    tableToken: "qr-token-tbl_03",
    status: "CONFIRMED",
    paidStatus: false,
    items: [
      {
        id: "item_04",
        productId: "prod_05",
        productName: "Espresso",
        productImageUrl: null,
        price: 35000,
        quantity: 1,
        subtotal: 35000,
        note: null,
      },
    ],
    totalAmount: 35000,
    estimateWaitMinutes: 3,
    note: null,
    createdAt: new Date(Date.now() - 3 * 60_000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ord_004",
    tableId: "tbl_04",
    tableName: "Bàn 04",
    tableToken: "qr-token-tbl_04",
    status: "READY",
    paidStatus: false,
    items: [
      {
        id: "item_05",
        productId: "prod_08",
        productName: "Trà đào cam sả",
        productImageUrl: null,
        price: 45000,
        quantity: 3,
        subtotal: 135000,
        note: "Ít đường",
      },
    ],
    totalAmount: 135000,
    estimateWaitMinutes: null,
    note: null,
    createdAt: new Date(Date.now() - 12 * 60_000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ord_005",
    tableId: "tbl_02",
    tableName: "Bàn 02",
    tableToken: "qr-token-tbl_02",
    status: "COMPLETED",
    paidStatus: true,
    items: [
      {
        id: "item_06",
        productId: "prod_02",
        productName: "Cà phê sữa",
        productImageUrl: null,
        price: 30000,
        quantity: 1,
        subtotal: 30000,
        note: null,
      },
    ],
    totalAmount: 30000,
    estimateWaitMinutes: null,
    note: null,
    createdAt: new Date(Date.now() - 60 * 60_000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const ACTIVE_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
];

const calcEstimatedWait = (prepTimePerItem = 5): number => {
  const preparingOrders = orders.filter(
    (o) => o.status === "PREPARING" || o.status === "CONFIRMED",
  );
  const totalItems = preparingOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0,
  );
  return Math.ceil((totalItems * prepTimePerItem) / 3);
};

const ok = (data: unknown) =>
  HttpResponse.json({ code: 200, message: "success", data });
const notFound = (msg = "Không tìm thấy") =>
  HttpResponse.json({ code: 404, message: msg, data: null }, { status: 404 });

export const orderHandlers = [
  // ─── [NEW] GET /api/order/active (Staff — Kanban) ────────────────────────
  // Mirror BE getActiveQueue(): chỉ trả PENDING/CONFIRMED/PREPARING/READY, sort ASC
  http.get("*/api/order/active", async () => {
    await delay(300);
    const activeOrders = orders
      .filter((o) => ACTIVE_STATUSES.includes(o.status))
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    return ok(activeOrders);
  }),

  // GET /api/order/page (Admin — paginated list)
  http.get("*/api/order/page", async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const pageNo = Number(url.searchParams.get("pageNo") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 20);
    const status = url.searchParams.get("status") as OrderStatus | null;

    let filtered = [...orders];
    if (status) filtered = filtered.filter((o) => o.status === status);
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const start = (pageNo - 1) * pageSize;
    return ok({
      list: filtered.slice(start, start + pageSize),
      total: filtered.length,
    });
  }),

  // GET /api/order/detail?id=
  http.get("*/api/order/detail", async ({ request }) => {
    await delay(200);
    const id = new URL(request.url).searchParams.get("id");
    const order = orders.find((o) => o.id === id);
    return order ? ok(order) : notFound();
  }),

  // GET /api/order/by-token/:token (Customer)
  http.get("*/api/order/by-token/:token", async ({ params }) => {
    await delay(300);
    const token = params.token as string;
    const tableOrders = orders
      .filter(
        (o) =>
          o.tableToken === token &&
          o.status !== "COMPLETED" &&
          o.status !== "CANCELLED",
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    return ok(tableOrders);
  }),

  // GET /api/order/estimated-wait
  http.get("*/api/order/estimated-wait", async () => {
    await delay(200);
    return ok({ estimatedMinutes: calcEstimatedWait() });
  }),

  // POST /api/order/create (Customer)
  http.post("*/api/order/create", async ({ request }) => {
    await delay(600);
    const body = (await request.json()) as Record<string, unknown>;
    const items = body.items as Array<{
      productId: string;
      quantity: number;
      note?: string;
    }>;
    const tableToken = body.tableToken as string;

    const isTable01 = tableToken.includes("tbl_01");
    const mockTableId = isTable01
      ? "tbl_01"
      : `tbl_${generateId("").slice(-3)}`;
    const mockTableName = isTable01 ? "Bàn 01" : "Bàn Khách";
    const estimatedWait = calcEstimatedWait();

    const newOrder: OrderDto = {
      id: generateId("ord"),
      tableId: mockTableId,
      tableName: mockTableName,
      tableToken: tableToken,
      status: "PENDING",
      paidStatus: false,
      items: items.map((item) => {
        const isCoffee =
          item.productId.includes("prod_01") ||
          item.productId.includes("prod_02");
        const mockPrice = isCoffee ? 25000 : 45000;
        const mockName = isCoffee
          ? "Cà phê " + item.productId.slice(-2)
          : "Trà " + item.productId.slice(-2);
        return {
          id: generateId("item"),
          productId: item.productId,
          productName: mockName,
          productImageUrl: null,
          price: mockPrice,
          quantity: item.quantity,
          subtotal: mockPrice * item.quantity,
          note: item.note || null,
        };
      }),
      totalAmount: 0,
      estimateWaitMinutes: estimatedWait,
      note: (body.note as string) || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    newOrder.totalAmount = newOrder.items.reduce(
      (sum, i) => sum + i.subtotal,
      0,
    );
    orders.unshift(newOrder);
    return ok(newOrder);
  }),

  // PUT /api/order/status (Staff) — expect { id, status }
  http.put("*/api/order/status", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as { id: string; status: OrderStatus };
    const idx = orders.findIndex((o) => o.id === body.id);
    if (idx === -1) return notFound();
    orders[idx].status = body.status;
    orders[idx].updatedAt = new Date().toISOString();
    return ok(orders[idx]);
  }),

  // POST /api/order/pay (Customer hoặc Staff)
  http.post("*/api/order/pay", async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as { orderId: string };
    const idx = orders.findIndex((o) => o.id === body.orderId);
    if (idx === -1) return notFound();
    orders[idx].paidStatus = true;
    orders[idx].updatedAt = new Date().toISOString();
    return ok(orders[idx]);
  }),

  // POST /api/order/pay-all (Customer)
  http.post("*/api/order/pay-all", async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as { tableToken: string };
    const updated: OrderDto[] = [];
    orders = orders.map((o) => {
      if (o.tableToken === body.tableToken && !o.paidStatus) {
        const updatedOrder = {
          ...o,
          paidStatus: true,
          updatedAt: new Date().toISOString(),
        };
        updated.push(updatedOrder);
        return updatedOrder;
      }
      return o;
    });
    return ok(updated);
  }),
];
